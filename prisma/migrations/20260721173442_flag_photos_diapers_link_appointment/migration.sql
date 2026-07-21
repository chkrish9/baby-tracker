-- AlterTable
ALTER TABLE "BabyPhoto" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DiaperLog" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DoctorNote" ADD COLUMN     "appointmentId" TEXT;

-- CreateIndex
CREATE INDEX "BabyPhoto_appointmentId_idx" ON "BabyPhoto"("appointmentId");

-- CreateIndex
CREATE INDEX "DiaperLog_appointmentId_idx" ON "DiaperLog"("appointmentId");

-- CreateIndex
CREATE INDEX "DoctorNote_appointmentId_idx" ON "DoctorNote"("appointmentId");

-- AddForeignKey
ALTER TABLE "DiaperLog" ADD CONSTRAINT "DiaperLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "DoctorAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BabyPhoto" ADD CONSTRAINT "BabyPhoto_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "DoctorAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorNote" ADD CONSTRAINT "DoctorNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "DoctorAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
