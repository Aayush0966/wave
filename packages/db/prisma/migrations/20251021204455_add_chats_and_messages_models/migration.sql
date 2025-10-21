/*
  Warnings:

  - A unique constraint covering the columns `[email,username]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'ATTACHMENT', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ChatParticipantRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MessageDeleteType" AS ENUM ('EVERYONE', 'SELF');

-- DropIndex
DROP INDEX "public"."user_email_key";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Chat" (
    "_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "_id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "Message" (
    "_id" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "_id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "attachmentUrl" TEXT NOT NULL,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "MessageSeen" (
    "_id" TEXT NOT NULL,
    "chatParticipantId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageSeen_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "MessageDelete" (
    "_id" TEXT NOT NULL,
    "chatParticipantId" TEXT NOT NULL,
    "deleteType" "MessageDeleteType" NOT NULL,
    "messageId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageDelete_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "React" (
    "_id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "reactedById" TEXT NOT NULL,

    CONSTRAINT "React_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "ChatParticipant_chatId_userId_idx" ON "ChatParticipant"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_userId_chatId_key" ON "ChatParticipant"("userId", "chatId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageSeen_chatParticipantId_messageId_key" ON "MessageSeen"("chatParticipantId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageDelete_chatParticipantId_messageId_key" ON "MessageDelete"("chatParticipantId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "React_reactedById_messageId_key" ON "React"("reactedById", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_username_key" ON "user"("email", "username");

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "ChatParticipant"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSeen" ADD CONSTRAINT "MessageSeen_chatParticipantId_fkey" FOREIGN KEY ("chatParticipantId") REFERENCES "ChatParticipant"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSeen" ADD CONSTRAINT "MessageSeen_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDelete" ADD CONSTRAINT "MessageDelete_chatParticipantId_fkey" FOREIGN KEY ("chatParticipantId") REFERENCES "ChatParticipant"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDelete" ADD CONSTRAINT "MessageDelete_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "React" ADD CONSTRAINT "React_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "React" ADD CONSTRAINT "React_reactedById_fkey" FOREIGN KEY ("reactedById") REFERENCES "ChatParticipant"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
