ALTER TABLE "Message" ADD COLUMN "clientMessageId" TEXT,
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "replyToId" TEXT;
CREATE UNIQUE INDEX "Message_senderId_clientMessageId_key" ON "Message"("senderId", "clientMessageId");
CREATE INDEX "Message_chatId_createdAt__id_idx" ON "Message"("chatId", "createdAt", "_id");
DROP INDEX IF EXISTS "Message_chatId_idx";
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
