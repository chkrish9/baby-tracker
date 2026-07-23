-- DropForeignKey
ALTER TABLE "BabyPhoto" DROP CONSTRAINT "BabyPhoto_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "DiaperLog" DROP CONSTRAINT "DiaperLog_appointmentId_fkey";

-- DropIndex
DROP INDEX "BabyPhoto_appointmentId_idx";

-- DropIndex
DROP INDEX "DiaperLog_appointmentId_idx";

-- AlterTable
ALTER TABLE "BabyPhoto" DROP COLUMN "appointmentId",
DROP COLUMN "flagged";

-- AlterTable
ALTER TABLE "DiaperLog" DROP COLUMN "appointmentId",
DROP COLUMN "flagged";

-- CreateTable
CREATE TABLE "PhotoAppointment" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaperAppointment" (
    "id" TEXT NOT NULL,
    "diaperLogId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaperAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoAppointment_appointmentId_idx" ON "PhotoAppointment"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoAppointment_photoId_appointmentId_key" ON "PhotoAppointment"("photoId", "appointmentId");

-- CreateIndex
CREATE INDEX "DiaperAppointment_appointmentId_idx" ON "DiaperAppointment"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DiaperAppointment_diaperLogId_appointmentId_key" ON "DiaperAppointment"("diaperLogId", "appointmentId");

-- AddForeignKey
ALTER TABLE "PhotoAppointment" ADD CONSTRAINT "PhotoAppointment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "BabyPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAppointment" ADD CONSTRAINT "PhotoAppointment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "DoctorAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaperAppointment" ADD CONSTRAINT "DiaperAppointment_diaperLogId_fkey" FOREIGN KEY ("diaperLogId") REFERENCES "DiaperLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaperAppointment" ADD CONSTRAINT "DiaperAppointment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "DoctorAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
