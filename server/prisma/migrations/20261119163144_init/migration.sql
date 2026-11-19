-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DONOR', 'NGO', 'BLOOD_BANK', 'HOSPITAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "Component" AS ENUM ('WHOLE_BLOOD', 'PLATELETS', 'PLASMA');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('CRITICAL', 'URGENT', 'NORMAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PLEDGED', 'DONATED', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role",
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorProfile" (
    "userId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isRare" BOOLEAN NOT NULL DEFAULT false,
    "lastDonatedOn" TIMESTAMP(3),

    CONSTRAINT "DonorProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "OrgProfile" (
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrgProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "component" "Component" NOT NULL,
    "units" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camp" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "description" TEXT,
    "bloodGroupsNeeded" "BloodGroup"[],

    CONSTRAINT "Camp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "component" "Component" NOT NULL,
    "units" INTEGER NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "neededBy" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'PLEDGED',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "DonorProfile_bloodGroup_isAvailable_idx" ON "DonorProfile"("bloodGroup", "isAvailable");

-- CreateIndex
CREATE INDEX "DonorProfile_isRare_idx" ON "DonorProfile"("isRare");

-- CreateIndex
CREATE INDEX "Stock_bloodGroup_component_idx" ON "Stock"("bloodGroup", "component");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_orgId_bloodGroup_component_key" ON "Stock"("orgId", "bloodGroup", "component");

-- CreateIndex
CREATE INDEX "Camp_city_date_idx" ON "Camp"("city", "date");

-- CreateIndex
CREATE INDEX "BloodRequest_status_bloodGroup_component_idx" ON "BloodRequest"("status", "bloodGroup", "component");

-- CreateIndex
CREATE INDEX "BloodRequest_city_idx" ON "BloodRequest"("city");

-- CreateIndex
CREATE INDEX "BloodRequest_neededBy_idx" ON "BloodRequest"("neededBy");

-- CreateIndex
CREATE INDEX "RequestResponse_responderId_idx" ON "RequestResponse"("responderId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestResponse_requestId_responderId_key" ON "RequestResponse"("requestId", "responderId");

-- AddForeignKey
ALTER TABLE "DonorProfile" ADD CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgProfile" ADD CONSTRAINT "OrgProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camp" ADD CONSTRAINT "Camp_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestResponse" ADD CONSTRAINT "RequestResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestResponse" ADD CONSTRAINT "RequestResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
