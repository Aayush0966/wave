import type { PrismaClient } from "@prisma/client";
import createRepository from "./base.repository";

export const createMessageRepository = (db: PrismaClient) => {
	return {
		...createRepository(db.message),
		async getMessagesByChatId(chatId: string, cursor: string | null = null, limit: number = 20) {
			const messages = await db.message.findMany({
				where: { chatId },
				take: limit + 1,
				skip: cursor ? 1 : 0,
				cursor: cursor ? { id: cursor } : undefined,
				include: {
					seenBy: true,
					reacts: true,
					deletedBy: true,
				},
				orderBy: { createdAt: "desc" },
			});

			const hasMore = messages.length > limit;
			const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;
			const nextCursor = hasMore
				? paginatedMessages[paginatedMessages.length - 1]?.id
				: null;
			const formattedMessages = paginatedMessages
				.toReversed()
				.map((message) => ({
					...message,
					seenBy: message.seenBy.filter(
						(seen) => seen.chatParticipantId !== message.senderId
					),
				}));

			return {
				messages: formattedMessages,
				nextCursor,
				hasMore,
			};
		},
		async createManyMessageSeen(
			messageIds: string[],
			chatParticipantId: string,
		) {
			return await db.messageSeen.createManyAndReturn({
				data: messageIds.map((messageId) => ({
					messageId,
					chatParticipantId,
				})),
				skipDuplicates: true,
			});
		},
	};
};
