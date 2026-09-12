import { createChatSchema, getChatByIdSchema } from "@wave/db";
import { protectedProcedure, router } from "../trpc";

export const chat = router({
	createChat: protectedProcedure
		.input(createChatSchema)
		.mutation(async ({ input, ctx }) => {
			const sessionUserId = ctx.session.user.id;
			const targetUserId = input.userId;

			const existingChat = await ctx.repos.chat.getChatBetweenUsers({
				user1Id: sessionUserId,
				user2Id: targetUserId,
			});
			if (existingChat) return existingChat;

			return await ctx.repos.chat.createChat({
				user1Id: sessionUserId,
				user2Id: targetUserId,
			});
		}),

	getUserChats: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.repos.chat.getUserChats(ctx.session.user.id);
	}),

	getChatById: protectedProcedure
		.input(getChatByIdSchema)
		.query(async ({ input, ctx }) => {
			return await ctx.repos.chat.getChatById({
				chatId: input.chatId,
				userId: ctx.session.user.id,
			});
		}),
});
