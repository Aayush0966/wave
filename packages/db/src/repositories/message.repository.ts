import type { Prisma, PrismaClient, MessageSeen } from "@prisma/client"
import createRepository, { type Repository } from "./base.repository"

export type MessageWithSeen = Prisma.MessageGetPayload<{
  include: { seenBy: true };
}>;

export type MessageRepository = Repository & {
  getMessagesByChatId: (chatId: string) => Promise<MessageWithSeen[] | null>;
  createMessageSeen: (messageId: string, chatParticipantId: string) => Promise<MessageSeen | null>;
  createManyMessageSeen: (messageIds: string[], chatParticipantId: string) => Promise<Prisma.BatchPayload>;
}

export const createMessageRepository = (db: PrismaClient) => {
  return {
    ...createRepository(db.message),
    async getMessagesByChatId(chatId: string) {
      const messages = await db.message.findMany({
        where: { chatId },
        include: {
          seenBy: true
        },
        orderBy: { createdAt: "asc" },
      })
      return messages.map((message) => ({
        ...message,
        seenBy: message.seenBy.filter(
          (seen) => seen.chatParticipantId !== message.senderId,
        ),
      }))
    },
    async createMessageSeen(messageId: string, chatParticipantId: string) {
      return await db.messageSeen.create({
        data: {
          messageId,
          chatParticipantId,
        },
      })
    },
    async createManyMessageSeen(messageIds: string[], chatParticipantId: string) {
      return await db.messageSeen.createMany({
        data: messageIds.map((messageId) => ({
          messageId,
          chatParticipantId,
        })),
        skipDuplicates: true,
      })
    },
  }
}
