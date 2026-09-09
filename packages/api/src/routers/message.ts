import {
  createMessageRepository,
  createMessageSchema,
  getMessagesByChatIdSchema,
  prisma,
} from "@wave/db";
import { createMessageService } from "../services/message";
import { protectedProcedure, router } from "../trpc";

const messageRepo = createMessageRepository(prisma);
const messageService = createMessageService(messageRepo);


export const message = router({
  createMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(async ({ input }) => {
      const { chatId, content, messageType, senderId, messageStatus } = input;

      return await messageService.createMessage({
        chatId,
        senderId,
        content: content ?? null,
        messageType,
        messageStatus,
      });
    }),
  getMessagesByChatId: protectedProcedure
    .input(getMessagesByChatIdSchema)
    .query(async ({ input }) => {
      const { chatId } = input;

      return messageService.getMessagesByChatId(chatId);
    }),
});
