import type { Message, PrismaClient } from "@prisma/client"
import createRepository, { type Repository } from "./base.repository"

export type MessageRepository = Repository & {
  getMessagesByChatId: (chatId: string) => Promise<Message[] | null>;
}

export const createMessageRepository = (db: PrismaClient) => {
  return {
    ...createRepository(db.message),
    async getMessagesByChatId(chatId: string) {
      const messages = await db.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
      })
      return messages
    }

  }
}
