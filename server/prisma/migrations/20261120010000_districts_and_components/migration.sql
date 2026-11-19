-- District-aware locations + component naming aligned with clinical products.
-- NOTE: hand-written (not prisma diff) because an enum value RENAME must be
-- used instead of drop+add — existing inventory rows store PLASMA.

-- Rename the plasma product to its clinical name (Fresh Frozen Plasma).
ALTER TYPE "Component" RENAME VALUE 'PLASMA' TO 'FFP';

-- Add packed red blood cells as a storable component.
ALTER TYPE "Component" ADD VALUE 'PRBC' AFTER 'WHOLE_BLOOD';

-- District master data (Karnataka now; add rows per state to extend).
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- Create an index on the columns that the unique constraint is defined on
CREATE UNIQUE INDEX "District_state_name_key" ON "District"("state", "name");

-- Organisation (hospital / blood bank / NGO) registered district.
-- Null = unknown or outside supported states; never inferred from address text.
ALTER TABLE "OrgProfile" ADD COLUMN "districtId" TEXT;
ALTER TABLE "OrgProfile" ADD CONSTRAINT "OrgProfile_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Camp venue district (optional for the same reason).
ALTER TABLE "Camp" ADD COLUMN "districtId" TEXT;
ALTER TABLE "Camp" ADD CONSTRAINT "Camp_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
