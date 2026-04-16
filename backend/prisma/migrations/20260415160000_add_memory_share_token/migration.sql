-- AlterTable
ALTER TABLE "memories" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "memories_shareToken_key" ON "memories"("shareToken");
