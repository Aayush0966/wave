import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 2000;

export const messageContentSchema = z
	.string()
	.trim()
	.min(1)
	.max(MAX_MESSAGE_LENGTH);
export const createMessageSchema = z.object({
	clientMessageId: z.string().uuid(),
	replyToId: z.string().min(1).optional(),
	chatId: z.string().min(1, "Chat ID is required"),
	content: z
		.string()
		.trim()
		.min(1, "Message content is required")
		.max(MAX_MESSAGE_LENGTH)
		.optional(),
	messageType: z.literal("TEXT").default("TEXT"),
	senderId: z.string().min(1, "Sender ID is required"),
	messageStatus: z.enum(["PENDING", "SENT", "DELIVERED"]).default("SENT"),
});

export const getMessagesByChatIdSchema = z.object({
	chatId: z.string().min(1, "Chat ID is required"),
	limit: z.number().int().min(1).max(100).default(20),
	cursor: z.string().optional(),
});

export const createManyMessageSeenSchema = z.object({
	messageIds: z.array(z.string().min(1)).min(1).max(100),
	chatParticipantId: z.string().min(1).optional(),
	chatId: z.string().min(1),
});

export const MESSAGE_REACTION_EMOJIS = [
	"👍",
	"❤️",
	"😂",
	"😮",
	"😢",
	"🙏",
] as const;

export const setMessageReactionSchema = z.object({
	messageId: z.string().min(1),
	emoji: z.enum(MESSAGE_REACTION_EMOJIS).nullable(),
});

export const unsendMessageSchema = z.object({ messageId: z.string().min(1) });

export const editMessageSchema = z.object({
	messageId: z.string().min(1),
	content: messageContentSchema,
});
export const syncMessagesSchema = z.object({
	chatId: z.string().min(1),
	since: z.iso.datetime(),
	cursor: z.string().optional(),
});
export const searchMessagesSchema = z.object({
	chatId: z.string().min(1),
	query: z.string().trim().min(1).max(200),
	cursor: z.string().optional(),
});
