-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "pincode" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "BloodRequest_hospitalId_idx" ON "BloodRequest"("hospitalId");
