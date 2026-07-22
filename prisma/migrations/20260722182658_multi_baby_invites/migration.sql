-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_babyId_fkey";

-- DropIndex
DROP INDEX "Invite_babyId_idx";

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "babyId";

-- CreateTable
CREATE TABLE "InviteBaby" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,

    CONSTRAINT "InviteBaby_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InviteBaby_babyId_idx" ON "InviteBaby"("babyId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteBaby_inviteId_babyId_key" ON "InviteBaby"("inviteId", "babyId");

-- AddForeignKey
ALTER TABLE "InviteBaby" ADD CONSTRAINT "InviteBaby_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteBaby" ADD CONSTRAINT "InviteBaby_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

