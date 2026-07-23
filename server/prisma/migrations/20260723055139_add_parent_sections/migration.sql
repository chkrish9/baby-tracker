-- CreateEnum
CREATE TYPE "ParentSection" AS ENUM ('LOGS', 'PHOTOS', 'HEALTH', 'DOCTOR_VISITS');

-- AlterTable
ALTER TABLE "BabyParent" ADD COLUMN     "sections" "ParentSection"[] DEFAULT ARRAY['LOGS', 'PHOTOS', 'HEALTH', 'DOCTOR_VISITS']::"ParentSection"[];

-- AlterTable
ALTER TABLE "InviteBaby" ADD COLUMN     "sections" "ParentSection"[] DEFAULT ARRAY[]::"ParentSection"[];
