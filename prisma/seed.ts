/**
 * prisma/seed.ts
 *
 * Seed script for ResourceHub demonstration data.
 * Run with: npm run db:seed
 *
 * This script is idempotent — it won't create duplicates on repeated runs.
 * It uses upsert where possible and clears existing seed data before re-seeding.
 */
import { PrismaClient, ResourceStatus, ReservationStatus, Role } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const ORG_TIMEZONE = process.env.ORG_TIMEZONE ?? "Asia/Colombo";

function orgTime(date: Date, hour: number, minute = 0): Date {
  // Set hours/minutes in org timezone by constructing a local string
  const localStr = `${date.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return fromZonedTime(new Date(localStr), ORG_TIMEZONE);
}

async function main() {
  console.log("🌱 Seeding ResourceHub database...");

  // Clear existing reservations first (to avoid FK conflicts), then resources, then users
  await prisma.reservation.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.user.deleteMany({});

  // --- USERS ---
  const [adminPassword, member1Password, member2Password, member3Password] =
    await Promise.all([
      hashPassword("Admin@12345"),
      hashPassword("Member1@12345"),
      hashPassword("Member2@12345"),
      hashPassword("Member3@12345"),
    ]);

  await Promise.all([
    prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@example.com",
        password: adminPassword,
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Connor",
        email: "sarah@example.com",
        password: member1Password,
        role: Role.MEMBER,
      },
    }),
    prisma.user.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        password: member2Password,
        role: Role.MEMBER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Alice Smith",
        email: "alice@example.com",
        password: member3Password,
        role: Role.MEMBER,
      },
    }),
  ]);

  console.log(`✅ Created 4 users (1 ADMIN, 3 MEMBERs)`);

  // --- RESOURCES ---
  const today = startOfDay(new Date());

  const [meetingRoom, confHall, projector, laptop, vehicle, labSpace] =
    await Promise.all([
      prisma.resource.create({
        data: {
          name: "Apollo Meeting Room",
          type: "Meeting Room",
          description: "A comfortable 8-person meeting room with whiteboard and TV screen.",
          location: "Floor 3, Block A",
          capacity: 8,
          status: ResourceStatus.ACTIVE,
        },
      }),
      prisma.resource.create({
        data: {
          name: "Zenith Conference Hall",
          type: "Conference Hall",
          description: "Large conference hall with projector, stage, and seating for 100.",
          location: "Ground Floor, Main Building",
          capacity: 100,
          status: ResourceStatus.ACTIVE,
        },
      }),
      prisma.resource.create({
        data: {
          name: "Epson EB-X49 Projector",
          type: "Projector",
          description: "3,600-lumen XGA projector with HDMI and VGA inputs.",
          location: "AV Equipment Cabinet, Floor 2",
          capacity: null,
          status: ResourceStatus.ACTIVE,
        },
      }),
      prisma.resource.create({
        data: {
          name: "Dell XPS 15 Laptop #1",
          type: "Laptop",
          description: "High-performance laptop for presentations and development.",
          location: "IT Department, Floor 2",
          capacity: null,
          status: ResourceStatus.ACTIVE,
        },
      }),
      prisma.resource.create({
        data: {
          name: "Toyota Corolla — WP CAB-1234",
          type: "Vehicle",
          description: "Company sedan for client visits and official travel.",
          location: "Ground Floor Parking Lot",
          capacity: 4,
          status: ResourceStatus.ACTIVE,
        },
      }),
      prisma.resource.create({
        data: {
          name: "Innovation Lab A",
          type: "Lab Space",
          description: "Open innovation lab space with 20 desks and collaborative tools.",
          location: "Floor 4, Research Wing",
          capacity: 20,
          status: ResourceStatus.ACTIVE,
        },
      }),
      prisma.resource.create({
        data: {
          name: "Hermes Meeting Room (Under Renovation)",
          type: "Meeting Room",
          description: "Currently inactive — undergoing renovation until further notice.",
          location: "Floor 1, Block B",
          capacity: 6,
          status: ResourceStatus.INACTIVE,
        },
      }),
    ]);

  console.log(`✅ Created ${7} resources`);

  // --- RESERVATIONS ---
  // Create realistic reservations spread across today and nearby days

  const reservations = await prisma.reservation.createMany({
    data: [
      // Apollo Meeting Room — today morning (confirmed)
      {
        resourceId: meetingRoom.id,
        requesterName: "Sarah Thompson",
        purpose: "Weekly product team standup",
        startAt: orgTime(today, 9, 0),
        endAt: orgTime(today, 9, 30),
        status: ReservationStatus.CONFIRMED,
      },
      // Apollo Meeting Room — today afternoon (confirmed)
      {
        resourceId: meetingRoom.id,
        requesterName: "James Perera",
        purpose: "Client demo — Acme Corp onboarding",
        startAt: orgTime(today, 14, 0),
        endAt: orgTime(today, 15, 30),
        status: ReservationStatus.CONFIRMED,
      },
      // Apollo Meeting Room — tomorrow (confirmed)
      {
        resourceId: meetingRoom.id,
        requesterName: "Priya Nair",
        purpose: "Q4 planning retrospective",
        startAt: orgTime(addDays(today, 1), 10, 0),
        endAt: orgTime(addDays(today, 1), 12, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Apollo Meeting Room — yesterday (confirmed, historical)
      {
        resourceId: meetingRoom.id,
        requesterName: "David Kim",
        purpose: "Engineering sync — sprint review",
        startAt: orgTime(addDays(today, -1), 11, 0),
        endAt: orgTime(addDays(today, -1), 12, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Apollo Meeting Room — yesterday cancelled (shows cancelled reservations don't block)
      {
        resourceId: meetingRoom.id,
        requesterName: "Elena Russo",
        purpose: "Design review (cancelled — presenter unavailable)",
        startAt: orgTime(addDays(today, -1), 14, 0),
        endAt: orgTime(addDays(today, -1), 15, 0),
        status: ReservationStatus.CANCELLED,
      },
      // Zenith Conference Hall — today (confirmed)
      {
        resourceId: confHall.id,
        requesterName: "Marcus Chen",
        purpose: "Annual company all-hands meeting",
        startAt: orgTime(today, 10, 0),
        endAt: orgTime(today, 12, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Projector — today (confirmed, adjacent to tomorrow)
      {
        resourceId: projector.id,
        requesterName: "Anita Fernando",
        purpose: "Investor presentation setup",
        startAt: orgTime(today, 13, 0),
        endAt: orgTime(today, 16, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Projector — tomorrow (confirmed, adjacent start exactly at 16:00 → valid)
      {
        resourceId: projector.id,
        requesterName: "Tom Bandara",
        purpose: "Training session — new employee onboarding",
        startAt: orgTime(addDays(today, 1), 9, 0),
        endAt: orgTime(addDays(today, 1), 11, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Vehicle — next week (confirmed)
      {
        resourceId: vehicle.id,
        requesterName: "Nuwan Jayawardena",
        purpose: "Client site visit — Colombo 07 office",
        startAt: orgTime(addDays(today, 3), 8, 30),
        endAt: orgTime(addDays(today, 3), 17, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Lab Space — in 2 days (confirmed)
      {
        resourceId: labSpace.id,
        requesterName: "Dr. Sanjaya Ranasinghe",
        purpose: "University intern hackathon",
        startAt: orgTime(addDays(today, 2), 8, 0),
        endAt: orgTime(addDays(today, 2), 18, 0),
        status: ReservationStatus.CONFIRMED,
      },
      // Laptop — today (confirmed)
      {
        resourceId: laptop.id,
        requesterName: "Kavya Sharma",
        purpose: "Remote client presentation",
        startAt: orgTime(today, 15, 0),
        endAt: orgTime(today, 17, 0),
        status: ReservationStatus.CONFIRMED,
      },
    ],
  });

  console.log(`✅ Created ${reservations.count} reservations`);
  console.log("\n🎉 Seed complete! ResourceHub is ready to use.");
  console.log(`\nSummary:`);
  console.log(`  Resources: 6 active, 1 inactive`);
  console.log(`  Reservations: ${reservations.count - 1} confirmed, 1 cancelled`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
