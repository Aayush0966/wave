import {
	createManyMessageSeenSchema,
	createMessageSchema,
	createMessageSeenSchema,
	getMessagesByChatIdSchema,
} from "@wave/db";
import { pusherServer } from "../pusher-server";
import { protectedProcedure, router } from "../trpc";

export const message = router({
	createMessage: protectedProcedure
		.input(createMessageSchema)
		.mutation(async ({ input, ctx }) => {
			const { chatId, content, messageType, senderId, messageStatus } = input;

			const message = await ctx.repos.message.create({
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
		.query(async ({ input, ctx }) => {
			const { chatId } = input;

			return ctx.repos.message.getMessagesByChatId(chatId);
		}),
	createMessageSeen: protectedProcedure
		.input(createMessageSeenSchema)
		.mutation(async ({ input, ctx }) => {
			const { messageId, chatParticipantId, chatId } = input;
			const message = await ctx.repos.message.createMessageSeen(
				messageId,
				chatParticipantId,
			);
			await pusherServer.trigger(`chat-${chatId}`, "message-seen", {
				messageId,
				chatParticipantId,
			});
			return message;
		}),
	createManyMessageSeen: protectedProcedure
		.input(createManyMessageSeenSchema)
		.mutation(async ({ input, ctx }) => {
			const { messageIds, chatParticipantId, chatId } = input;
			const message = await ctx.repos.message.createManyMessageSeen(
				messageIds,
				chatParticipantId,
			);
			await pusherServer.trigger(`chat-${chatId}`, "messages-seen", {
				messageIds,
				chatParticipantId,
			});
			return message;
		}),
});
