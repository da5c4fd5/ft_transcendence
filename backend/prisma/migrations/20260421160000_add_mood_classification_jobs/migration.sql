-- CreateEnum
CREATE TYPE "MemoryMoodSource" AS ENUM ('MANUAL', 'CLASSIFIED');

-- CreateEnum
CREATE TYPE "MoodClassificationJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "memories" ADD COLUMN "moodSource" "MemoryMoodSource";

-- CreateTable
CREATE TABLE "mood_classification_jobs" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MoodClassificationJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "classifierModel" VARCHAR(128),
    "rawLabel" VARCHAR(64),
    "rawScore" DOUBLE PRECISION,
    "mood" VARCHAR(32),
    "labelsJson" JSONB,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mood_classification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mood_classification_jobs_memoryId_key" ON "mood_classification_jobs"("memoryId");

-- CreateIndex
CREATE INDEX "mood_classification_jobs_status_availableAt_createdAt_idx" ON "mood_classification_jobs"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "mood_classification_jobs_userId_createdAt_idx" ON "mood_classification_jobs"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "mood_classification_jobs" ADD CONSTRAINT "mood_classification_jobs_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_classification_jobs" ADD CONSTRAINT "mood_classification_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
