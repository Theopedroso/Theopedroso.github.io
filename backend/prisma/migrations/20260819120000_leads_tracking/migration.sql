-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "contacted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;
