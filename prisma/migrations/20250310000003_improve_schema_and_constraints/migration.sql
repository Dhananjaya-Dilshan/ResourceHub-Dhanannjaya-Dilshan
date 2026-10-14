-- AlterTable: Add user_id column to Reservation
ALTER TABLE "Reservation" ADD COLUMN "user_id" TEXT;

-- CreateIndex: Add index on user_id
CREATE INDEX "Reservation_user_id_idx" ON "Reservation"("user_id");

-- CreateIndex: Add composite index on (status, start_at)
CREATE INDEX "Reservation_status_start_at_idx" ON "Reservation"("status", "start_at");

-- CreateIndex: Add composite index on (status, type)
CREATE INDEX "Resource_status_type_idx" ON "Resource"("status", "type");

-- AddForeignKey: Foreign key from Reservation.user_id to User.id with ON DELETE SET NULL
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add Check Constraint: Ensure end_at is strictly after start_at
ALTER TABLE "Reservation" ADD CONSTRAINT "reservation_valid_time_range" CHECK ("end_at" > "start_at");

-- Add Check Constraint: Positive capacity if specified (null allowed)
ALTER TABLE "Resource" ADD CONSTRAINT "resource_positive_capacity" CHECK ("capacity" IS NULL OR "capacity" > 0);

-- Add Check Constraints: Non-empty trimmed name and type
ALTER TABLE "Resource" ADD CONSTRAINT "resource_name_not_empty" CHECK (length(trim("name")) > 0);
ALTER TABLE "Resource" ADD CONSTRAINT "resource_type_not_empty" CHECK (length(trim("type")) > 0);
