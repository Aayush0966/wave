import type { PrismaClient } from "@prisma/client"
import createRepository from "./base.repository"



export const createMessageRepository = (db: PrismaClient) => {
  return {
    ...createRepository(db.message),
    async getMessagesByChatId(chatId: string) {
      const messages = await db.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
      })
      return messages
    },
    async createMessage({ chatId, senderId, content }: { chatId: string; senderId: string; content: string }) {
      const message = await db.message.create({
        data: {
          chatId,
          senderId,
          content,
        },
      })
      return message
    },

  }
}
