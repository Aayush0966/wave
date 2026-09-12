import type { MessageRepository } from "@wave/db";
import type { Message, MessageSeen, Prisma } from "@prisma/client";
import type { MessageWithSeen } from "@wave/db";

type CreateMessageInput = Pick<
  Message,
  "chatId" | "senderId" | "content" | "messageType" | "messageStatus"
>;

type MessageService = {
  createMessage: (message: CreateMessageInput) => Promise<Message | null>;
  getMessagesByChatId: (chatId: string) => Promise<MessageWithSeen[] | null>;
  createMessageSeen: (messageId: string, chatParticipantId: string) => Promise<MessageSeen | null>;
  createManyMessageSeen: (messageIds: string[], chatParticipantId: string) => Promise<Prisma.BatchPayload>;
};

export const createMessageService = (repo: MessageRepository): MessageService => {
  return {
    createMessage: async (message: CreateMessageInput) => {
      return repo.create(message);
    },
    getMessagesByChatId: async (chatId: string) => {
      return repo.getMessagesByChatId(chatId);
    },
    createMessageSeen: async (messageId: string, chatParticipantId: string) => {
      return repo.createMessageSeen(messageId, chatParticipantId);
    },
    createManyMessageSeen: async (messageIds: string[], chatParticipantId: string) => {
      return repo.createManyMessageSeen(messageIds, chatParticipantId);
    }
  };
}
