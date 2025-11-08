import { z } from "zod";

export const userPairSchema = z.object({
	user1Id: z.string().min(1, "User 1 ID is required"),
	user2Id: z.string().min(1, "User 2 ID is required"),
});

export const createChatSchema = userPairSchema;

export type CreateChatParams = z.infer<typeof createChatSchema>;
export type UserPair = z.infer<typeof userPairSchema>;
