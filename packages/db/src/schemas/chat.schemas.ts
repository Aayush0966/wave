import { z } from "zod";

export const userPairSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export const createChatSchema = userPairSchema;

// Schema for service layer that expects both user IDs
export const createChatServiceSchema = z.object({
	user1Id: z.string().min(1, "User 1 ID is required"),
	user2Id: z.string().min(1, "User 2 ID is required"),
});

export type CreateChatParams = z.infer<typeof createChatServiceSchema>;
export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UserPair = z.infer<typeof userPairSchema>;
