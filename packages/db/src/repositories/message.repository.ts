import type { PrismaClient } from "@prisma/client";
import createRepository from "./base.repository";

export const createMessageRepository = (db: PrismaClient) => {
	return {
		...createRepository(db.message),
		async getMessagesByChatId(chatId: string) {
			const messages = await db.message.findMany({
				where: { chatId },
				include: {
					seenBy: true,
					reacts: true,
					deletedBy: true,
				},
				orderBy: { createdAt: "asc" },
			});
			return messages.map((message) => ({
				...message,
				seenBy: message.seenBy.filter(
					(seen) => seen.chatParticipantId !== message.senderId,
				),
			}));
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
