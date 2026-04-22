CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_senderId_recipientId_createdAt_idx" ON "chat_messages"("senderId", "recipientId", "createdAt" DESC);
CREATE INDEX "chat_messages_recipientId_senderId_createdAt_idx" ON "chat_messages"("recipientId", "senderId", "createdAt" DESC);

ALTER TABLE "chat_messages"
ADD CONSTRAINT "chat_messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
ADD CONSTRAINT "chat_messages_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
