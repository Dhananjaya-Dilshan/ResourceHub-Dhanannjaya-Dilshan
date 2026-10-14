-- Enable btree_gist extension for combining scalar equality with range overlap
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enforce zero-overlap for CONFIRMED reservations on the same resource
-- Using half-open intervals [start_at, end_at) with the && range overlap operator
ALTER TABLE "Reservation"
ADD CONSTRAINT "reservation_no_overlap"
EXCLUDE USING gist (
  "resource_id" WITH =,
  tstzrange("start_at", "end_at", '[)') WITH &&
)
WHERE ("status" = 'CONFIRMED');
