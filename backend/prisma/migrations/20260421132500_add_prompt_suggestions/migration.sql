-- CreateEnum
CREATE TYPE "PromptSuggestionStatus" AS ENUM ('IDLE', 'GENERATING', 'READY', 'ERROR');

-- CreateTable
CREATE TABLE "prompt_suggestion_states" (
    "userId" TEXT NOT NULL,
    "contextHash" TEXT,
    "generationToken" TEXT,
    "model" VARCHAR(128),
    "systemPrompt" TEXT,
    "requestPrompt" TEXT,
    "generationStatus" "PromptSuggestionStatus" NOT NULL DEFAULT 'IDLE',
    "lastError" TEXT,
    "expiresAt" TIMESTAMP(3),
    "generationStartedAt" TIMESTAMP(3),
    "generationFinishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_suggestion_states_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "prompt_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_suggestions_userId_position_key" ON "prompt_suggestions"("userId", "position");

-- CreateIndex
CREATE INDEX "prompt_suggestions_userId_position_idx" ON "prompt_suggestions"("userId", "position");

-- AddForeignKey
ALTER TABLE "prompt_suggestion_states" ADD CONSTRAINT "prompt_suggestion_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_suggestions" ADD CONSTRAINT "prompt_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
