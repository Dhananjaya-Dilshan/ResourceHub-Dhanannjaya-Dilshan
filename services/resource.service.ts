/**
 * services/resource.service.ts
 *
 * Business logic for resource management.
 * All database access is centralized here; pages should call these functions.
 */
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  AppError,
} from "@/lib/errors";
import {
  createResourceSchema,
  updateResourceSchema,
  resourceQuerySchema,
  type CreateResourceInput,
  type UpdateResourceInput,
  type ResourceQuery,
} from "@/lib/validations/resource";
import type {
  Resource,
  ResourceWithCount,
  PaginatedResult,
} from "@/types";
import { ResourceStatus } from "@prisma/client";

/**
 * Retrieve a paginated, filtered list of resources.
 */
export async function listResources(
  query: Partial<ResourceQuery>
): Promise<PaginatedResult<ResourceWithCount>> {
  const parsed = resourceQuerySchema.parse(query);
  const { search, type, status, page, pageSize } = parsed;

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { type: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(type && type !== "all" ? { type } : {}),
    ...(status && status !== "all"
      ? { status: status as ResourceStatus }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { _count: { select: { reservations: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Retrieve all active resources (for reservation form dropdowns).
 */
export async function listActiveResources(): Promise<Resource[]> {
  return prisma.resource.findMany({
    where: { status: ResourceStatus.ACTIVE },
    orderBy: { name: "asc" },
  });
}

/**
 * Get a single resource by ID.
 * Throws NotFoundError if the resource does not exist.
 */
export async function getResource(id: string): Promise<Resource> {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new NotFoundError("Resource");
  return resource;
}

/**
 * Get a resource with its reservation history.
 */
export async function getResourceWithReservations(id: string) {
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: { startAt: "desc" },
        take: 50,
      },
    },
  });
  if (!resource) throw new NotFoundError("Resource");
  return resource;
}

/**
 * Create a new resource after validating input.
 */
export async function createResource(
  input: CreateResourceInput
): Promise<Resource> {
  const data = createResourceSchema.parse(input);

  // Normalize empty string fields to null
  const description =
    !data.description || data.description === "" ? null : data.description;
  const location =
    !data.location || data.location === "" ? null : data.location;

  return prisma.resource.create({
    data: {
      name: data.name,
      type: data.type,
      description,
      location,
      capacity: data.capacity ?? null,
      status: data.status ?? ResourceStatus.ACTIVE,
    },
  });
}

/**
 * Update an existing resource.
 * Throws NotFoundError if resource not found.
 */
export async function updateResource(
  id: string,
  input: UpdateResourceInput
): Promise<Resource> {
  // Verify resource exists
  await getResource(id);

  const data = updateResourceSchema.parse(input);

  // Build update payload
  const updateData: Partial<{
    name: string;
    type: string;
    description: string | null;
    location: string | null;
    capacity: number | null;
    status: ResourceStatus;
  }> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.description !== undefined)
    updateData.description =
      data.description === "" ? null : data.description ?? null;
  if (data.location !== undefined)
    updateData.location =
      data.location === "" ? null : data.location ?? null;
  if (data.capacity !== undefined) updateData.capacity = data.capacity ?? null;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.resource.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Deactivate a resource.
 * Policy: deactivation is allowed even if future reservations exist.
 * Existing reservations are preserved; no new ones can be created.
 */
export async function deactivateResource(id: string): Promise<Resource> {
  const resource = await getResource(id);

  if (resource.status === ResourceStatus.INACTIVE) {
    throw new AppError(
      "Resource is already inactive.",
      "VALIDATION_ERROR",
      422
    );
  }

  return prisma.resource.update({
    where: { id },
    data: { status: ResourceStatus.INACTIVE },
  });
}

/**
 * Reactivate an inactive resource.
 */
export async function reactivateResource(id: string): Promise<Resource> {
  const resource = await getResource(id);

  if (resource.status === ResourceStatus.ACTIVE) {
    throw new AppError(
      "Resource is already active.",
      "VALIDATION_ERROR",
      422
    );
  }

  return prisma.resource.update({
    where: { id },
    data: { status: ResourceStatus.ACTIVE },
  });
}

/**
 * Get all distinct resource types from the database.
 */
export async function getResourceTypes(): Promise<string[]> {
  const resources = await prisma.resource.findMany({
    select: { type: true },
    distinct: ["type"],
    orderBy: { type: "asc" },
  });
  return resources.map((r) => r.type);
}

/**
 * Permanently delete a resource and any associated reservations.
 */
export async function deleteResource(id: string): Promise<{ id: string; name: string }> {
  const resource = await getResource(id);

  await prisma.$transaction([
    prisma.reservation.deleteMany({ where: { resourceId: id } }),
    prisma.resource.delete({ where: { id } }),
  ]);

  return { id: resource.id, name: resource.name };
}
