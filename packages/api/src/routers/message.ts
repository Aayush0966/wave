import {
  createMessageRepository,
  createMessageSchema,
  getMessagesByChatIdSchema,
  createMessageSeenSchema,
  createManyMessageSeenSchema,
  prisma,
} from "@wave/db";
import { createMessageService } from "../services/message";
import { protectedProcedure, router } from "../trpc";
import { pusherServer } from "../pusher-server";

const messageRepo = createMessageRepository(prisma);
const messageService = createMessageService(messageRepo);


export const message = router({
  createMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(async ({ input }) => {
      const { chatId, content, messageType, senderId, messageStatus } = input;

      const message = await messageService.createMessage({
        chatId,
        senderId,
        content: content ?? null,
        messageType,
        messageStatus,
      });
      await pusherServer.trigger(`chat-${chatId}`, "new-message", message);
      return message;
    }),
  getMessagesByChatId: protectedProcedure
    .input(getMessagesByChatIdSchema)
    .query(async ({ input }) => {
      const { chatId } = input;

      return messageService.getMessagesByChatId(chatId);
    }),
  createMessageSeen: protectedProcedure
    .input(createMessageSeenSchema)
    .mutation(async ({ input }) => {
      const { messageId, chatParticipantId, chatId } = input;
      const message = await messageService.createMessageSeen(messageId, chatParticipantId);
      await pusherServer.trigger(`chat-${chatId}`, "message-seen", {
        messageId,
        chatParticipantId,
      });
      return message;
    }),
  createManyMessageSeen: protectedProcedure
    .input(createManyMessageSeenSchema)
    .mutation(async ({ input }) => {
      const { messageIds, chatParticipantId, chatId } = input;
      const message = await messageService.createManyMessageSeen(messageIds, chatParticipantId);
      await pusherServer.trigger(`chat-${chatId}`, "messages-seen", {messageIds, chatParticipantId});
      return message;
    }),
});
