import { TRPCError } from "@trpc/server";
import { createChatSchema, getChatByIdSchema } from "@wave/db";
import { z } from "zod";
import { requireChatParticipant } from "../chat-access";
import {
	broadcast,
	chatChannel,
	notifyChatList,
	userChannel,
} from "../chat-events";
import { protectedProcedure, router } from "../trpc";

export const chat = router({
	getActivity: protectedProcedure.query(({ ctx }) =>
		ctx.repos.chat.getActivity(ctx.session.user.id),
	),
	getBlockedUsers: protectedProcedure.query(({ ctx }) =>
		ctx.repos.chat.getBlockedUsers(ctx.session.user.id),
	),
	unblockUser: protectedProcedure
		.input(z.object({ userId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const removed = await ctx.repos.chat.setBlocked(
				ctx.session.user.id,
				input.userId,
				false,
			);
			await broadcast(
				userChannel(ctx.session.user.id),
				"chat-list-updated",
				{},
			);
			if ("count" in removed && removed.count > 0) {
				await broadcast(userChannel(input.userId), "chat-list-updated", {});
			}
			return { userId: input.userId };
		}),
	remove: protectedProcedure
		.input(getChatByIdSchema)
		.mutation(async ({ input, ctx }) => {
			await requireChatParticipant(ctx, input.chatId);
			await ctx.repos.chat.removeForUser(input.chatId, ctx.session.user.id);
			await broadcast(
				userChannel(ctx.session.user.id),
				"chat-list-updated",
				{},
			);
			return { chatId: input.chatId };
		}),
	setBlocked: protectedProcedure
		.input(z.object({ chatId: z.string().min(1), blocked: z.boolean() }))
		.mutation(async ({ input, ctx }) => {
			await requireChatParticipant(ctx, input.chatId);
			const users = await ctx.repos.chat.getParticipantUserIds(input.chatId);
			const other = users.find((id) => id !== ctx.session.user.id);
			if (users.length !== 2 || !other)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Blocking is available in conversations with another person",
				});
			await ctx.repos.chat.setBlocked(
				ctx.session.user.id,
				other,
				input.blocked,
			);
			await notifyChatList(ctx, input.chatId);
			return await ctx.repos.chat.getBlockStatus(
				input.chatId,
				ctx.session.user.id,
			);
		}),
	markAsRead: protectedProcedure
		.input(getChatByIdSchema)
		.mutation(async ({ input, ctx }) => {
			const participant = await requireChatParticipant(ctx, input.chatId);
			const records = await ctx.repos.message.markChatAsSeen(
				input.chatId,
				participant.id,
			);
			// Keep each realtime payload below the service's size limit.
			for (let offset = 0; offset < records.length; offset += 40) {
				await broadcast(
					chatChannel(input.chatId),
					"messages-seen",
					records.slice(offset, offset + 40),
				);
			}
			await broadcast(
				userChannel(ctx.session.user.id),
				"chat-list-updated",
				{},
			);
			return { count: records.length };
		}),
	createChat: protectedProcedure
		.input(createChatSchema)
		.mutation(async ({ input, ctx }) => {
			const sessionUserId = ctx.session.user.id;
			const targetUserId = input.userId;

			const existingChat = await ctx.repos.chat.getChatBetweenUsers({
				user1Id: sessionUserId,
				user2Id: targetUserId,
			});
			if (existingChat) {
				await ctx.repos.chat.reopenForUser(existingChat.id, sessionUserId);
				await broadcast(userChannel(sessionUserId), "chat-list-updated", {});
				return existingChat;
			}

			const created = await ctx.repos.chat.createChat({
				user1Id: sessionUserId,
				user2Id: targetUserId,
			});
			await Promise.all(
				created.chatParticipants.map((participant) =>
					broadcast(userChannel(participant.userId), "chat-list-updated", {}),
				),
			);
			return created;
		}),

	getUserChats: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.repos.chat.getUserChats(ctx.session.user.id);
	}),

	getChatById: protectedProcedure
		.input(getChatByIdSchema)
		.query(async ({ input, ctx }) => {
			await requireChatParticipant(ctx, input.chatId);
			return await ctx.repos.chat.getChatById({
				chatId: input.chatId,
				userId: ctx.session.user.id,
			});
		}),
});
