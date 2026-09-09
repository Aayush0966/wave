import { z } from "zod";


export const createMessageSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  content: z.string().min(1, "Message content is required").optional(),
  messageType: z.enum(["TEXT", "ATTACHMENT", "IMAGE", "VIDEO"]).default("TEXT"),
  senderId: z.string().min(1, "Sender ID is required"),
  messageStatus: z.enum(["PENDING", "SENT", "DELIVERED", "READ"]).default("SENT"),
});

export const getMessagesByChatIdSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  limit: z.number().optional(),
  offset: z.number().optional(),
});
