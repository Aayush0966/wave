import type { MessageRepository } from "@wave/db";
import type { Message } from "@prisma/client";

type CreateMessageInput = Pick<
  Message,
  "chatId" | "senderId" | "content" | "messageType" | "messageStatus"
>;

type MessageService = {
  createMessage: (message: CreateMessageInput) => Promise<Message | null>;
  getMessagesByChatId: (chatId: string) => Promise<Message[] | null>;
};

export const createMessageService = (repo: MessageRepository): MessageService => {
  return {
    createMessage: async (message: CreateMessageInput) => {
      return repo.create(message);
    },
    getMessagesByChatId: async (chatId: string) => {
      return repo.getMessagesByChatId(chatId);
    }
  };
}
