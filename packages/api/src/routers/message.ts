import { TRPCError } from "@trpc/server";
import {
	createManyMessageSeenSchema,
	createMessageSchema,
	editMessageSchema,
	getMessagesByChatIdSchema,
	searchMessagesSchema,
	setMessageReactionSchema,
	syncMessagesSchema,
	unsendMessageSchema,
} from "@wave/db";
import { z } from "zod";
import { requireChatCanSend, requireChatParticipant } from "../chat-access";
import {
	broadcast,
	chatChannel,
	notifyChatList,
	userChannel,
} from "../chat-events";
import { removeMedia } from "../media-storage";
import { protectedProcedure, router } from "../trpc";

export const message = router({
	unsend: protectedProcedure
		.input(unsendMessageSchema)
		.mutation(async ({ input, ctx }) => {
			const result = await ctx.repos.message.unsend(
				input.messageId,
				ctx.session.user.id,
			);
			if (!result)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			await broadcast(
				chatChannel(result.message.chatId),
				"message-unsent",
				result.message,
			);
			await removeMedia(result.attachmentUrls).catch((error: unknown) =>
				console.error(
					"Media cleanup failed after unsend; orphan sweep will retry",
					error,
				),
			);
			return result.message;
		}),
	edit: protectedProcedure
		.input(editMessageSchema)
		.mutation(async ({ input, ctx }) => {
			const context = await ctx.repos.message.getReactionContext(
				input.messageId,
				ctx.session.user.id,
			);
			if (!context)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			await requireChatCanSend(ctx, context.chatId);
			const result = await ctx.repos.message.edit(
				input.messageId,
				ctx.session.user.id,
				input.content,
			);
			if (!result)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			await broadcast(chatChannel(result.chatId), "message-edited", result);
			return result;
		}),
	hide: protectedProcedure
		.input(
			z.object({ chatId: z.string().min(1), messageId: z.string().min(1) }),
		)
		.mutation(async ({ input, ctx }) => {
			const participant = await requireChatParticipant(ctx, input.chatId);
			if (
				!(await ctx.repos.message.hide(
					input.messageId,
					participant.id,
					input.chatId,
				))
			)
				throw new TRPCError({ code: "NOT_FOUND" });
			const update = { chatId: input.chatId, messageId: input.messageId };
			await broadcast(
				userChannel(ctx.session.user.id),
				"message-hidden",
				update,
			);
			return update;
		}),
	setReaction: protectedProcedure
		.input(setMessageReactionSchema)
		.mutation(async ({ input, ctx }) => {
			const context = await ctx.repos.message.getReactionContext(
				input.messageId,
				ctx.session.user.id,
			);
			const participant = context?.chat.chatParticipants[0];
			if (!context || !participant)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			await requireChatCanSend(ctx, context.chatId);
			const reaction = await ctx.repos.message.setReaction(
				input.messageId,
				participant.id,
				input.emoji,
			);
			const update = {
				messageId: input.messageId,
				reactedById: participant.id,
				reaction,
			};
			await broadcast(chatChannel(context.chatId), "message-reaction", update);
			return update;
		}),
	createMessage: protectedProcedure
		.input(createMessageSchema)
		.mutation(async ({ input, ctx }) => {
			const participant = await requireChatCanSend(ctx, input.chatId);
			if (input.senderId !== participant.id)
				throw new TRPCError({ code: "FORBIDDEN" });
			if (!input.content)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Message cannot be empty",
				});
			const existing = await ctx.repos.message.findByClientId(
				participant.id,
				input.clientMessageId,
			);
			if (existing) {
				if (existing.chatId !== input.chatId)
					throw new TRPCError({
						code: "CONFLICT",
						message: "Send identifier already used in another chat",
					});
				return existing;
			}
			if (
				input.replyToId &&
				!(await ctx.repos.message.validReply(
					input.replyToId,
					input.chatId,
					participant.id,
				))
			)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Reply target is unavailable",
				});
			const saved = await ctx.repos.message.createIdempotent({
				chatId: input.chatId,
				senderId: participant.id,
				content: input.content,
				messageType: "TEXT",
				clientMessageId: input.clientMessageId,
				replyToId: input.replyToId,
			});
			if (saved.chatId !== input.chatId)
				throw new TRPCError({
					code: "CONFLICT",
					message: "Send identifier already used in another chat",
				});
			await broadcast(chatChannel(input.chatId), "new-message", saved);
			await notifyChatList(ctx, input.chatId);
			return saved;
		}),
	getMessagesByChatId: protectedProcedure
		.input(getMessagesByChatIdSchema)
		.query(async ({ input, ctx }) => {
			const participant = await requireChatParticipant(ctx, input.chatId);
			return ctx.repos.message.getMessagesByChatId(
				input.chatId,
				participant.id,
				input.cursor,
				input.limit,
			);
		}),
	sync: protectedProcedure
		.input(syncMessagesSchema)
		.query(async ({ input, ctx }) => {
			const participant = await requireChatParticipant(ctx, input.chatId);
			return ctx.repos.message.sync(
				input.chatId,
				participant.id,
				input.since,
				input.cursor,
			);
		}),
	search: protectedProcedure
		.input(searchMessagesSchema)
		.query(async ({ input, ctx }) => {
			const participant = await requireChatParticipant(ctx, input.chatId);
			return ctx.repos.message.search(
				input.chatId,
				participant.id,
				input.query,
				input.cursor,
			);
		}),
	typing: protectedProcedure
		.input(z.object({ chatId: z.string().min(1), typing: z.boolean() }))
		.mutation(async ({ input, ctx }) => {
			const participant = await requireChatCanSend(ctx, input.chatId);
			await broadcast(chatChannel(input.chatId), "typing", {
				participantId: participant.id,
				typing: input.typing,
				name: ctx.session.user.name,
			});
		}),
	createManyMessageSeen: protectedProcedure
		.input(createManyMessageSeenSchema)
		.mutation(async ({ input, ctx }) => {
			const participant = await requireChatParticipant(ctx, input.chatId);
			if (input.chatParticipantId && input.chatParticipantId !== participant.id)
				throw new TRPCError({ code: "FORBIDDEN" });
			const records = await ctx.repos.message.createManyMessageSeen(
				input.messageIds,
				participant.id,
				input.chatId,
			);
			if (!records)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Messages must belong to this chat",
				});
			await broadcast(chatChannel(input.chatId), "messages-seen", records);
			return records;
		}),
});
