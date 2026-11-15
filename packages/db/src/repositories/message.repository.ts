import type { Prisma, PrismaClient } from "@prisma/client";
import createRepository from "./base.repository";

const include = {
	MessageAttachment: true,
	seenBy: true,
	reacts: true,
	deletedBy: true,
	replyTo: {
		select: {
			id: true,
			senderId: true,
			content: true,
			messageType: true,
			deletedBy: true,
		},
	},
} satisfies Prisma.MessageInclude;
const visible = (participantId: string) => ({
	deletedBy: {
		none: { chatParticipantId: participantId, deleteType: "SELF" as const },
	},
});
const format = (
	message: Prisma.MessageGetPayload<{ include: typeof include }>,
	participantId?: string,
) => ({
	...message,
	seenBy: message.seenBy.filter(
		(seen) => seen.chatParticipantId !== message.senderId,
	),
	replyTo: message.replyTo?.deletedBy.some(
		(deleted) =>
			deleted.deleteType === "EVERYONE" ||
			deleted.chatParticipantId === participantId,
	)
		? null
		: message.replyTo,
});

export const createMessageRepository = (db: PrismaClient) => ({
	...createRepository(db.message),
	async getMessagesByChatId(
		chatId: string,
		participantId: string,
		cursor: string | null = null,
		limit = 20,
	) {
		const messages = await db.message.findMany({
			where: { chatId, ...visible(participantId) },
			take: limit + 1,
			skip: cursor ? 1 : 0,
			cursor: cursor ? { id: cursor } : undefined,
			include,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		});
		const hasMore = messages.length > limit;
		const page = messages.slice(0, limit);
		return {
			messages: page.toReversed().map((item) => format(item, participantId)),
			nextCursor: hasMore ? page.at(-1)?.id : null,
			hasMore,
		};
	},
	getParticipant(chatId: string, userId: string) {
		return db.chatParticipant.findUnique({
			where: { userId_chatId: { userId, chatId } },
		});
	},
	findByClientId(senderId: string, clientMessageId: string) {
		return db.message.findUnique({
			where: { senderId_clientMessageId: { senderId, clientMessageId } },
			include,
		});
	},
	async validReply(messageId: string, chatId: string, participantId: string) {
		return db.message.findFirst({
			where: {
				id: messageId,
				chatId,
				...visible(participantId),
				NOT: { deletedBy: { some: { deleteType: "EVERYONE" } } },
			},
			select: { id: true },
		});
	},
	async createIdempotent(data: {
		chatId: string;
		senderId: string;
		content: string | null;
		messageType: "TEXT" | "IMAGE" | "VIDEO";
		clientMessageId: string;
		replyToId?: string;
		attachmentUrl?: string;
	}) {
		const { attachmentUrl, ...fields } = data;
		const where = {
			senderId_clientMessageId: {
				senderId: data.senderId,
				clientMessageId: data.clientMessageId,
			},
		};
		try {
			return await db.message.upsert({
				where,
				update: {},
				create: {
					...fields,
					messageStatus: "SENT",
					...(attachmentUrl
						? { MessageAttachment: { create: { attachmentUrl } } }
						: {}),
				},
				include,
			});
		} catch (error) {
			if (
				(error as { code?: string; cause?: { code?: string } }).code !==
					"P2002" &&
				(error as { cause?: { code?: string } }).cause?.code !== "P2002"
			)
				throw error;
			return db.message.findUniqueOrThrow({ where, include });
		}
	},
	async sync(
		chatId: string,
		participantId: string,
		since: string,
		cursor?: string,
	) {
		const messages = await db.message.findMany({
			where: { chatId, createdAt: { gte: new Date(since) } },
			include,
			orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			take: 101,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		});
		return {
			messages: messages
				.slice(0, 100)
				.map((item) => format(item, participantId)),
			nextCursor: messages.length > 100 ? messages[99]?.id : null,
		};
	},
	async search(
		chatId: string,
		participantId: string,
		query: string,
		cursor?: string,
	) {
		const messages = await db.message.findMany({
			where: {
				chatId,
				...visible(participantId),
				deletedBy: {
					none: {
						OR: [
							{ deleteType: "EVERYONE" },
							{ chatParticipantId: participantId, deleteType: "SELF" },
						],
					},
				},
				content: { contains: query, mode: "insensitive" },
			},
			include,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: 21,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		});
		return {
			messages: messages
				.slice(0, 20)
				.map((item) => format(item, participantId)),
			nextCursor: messages.length > 20 ? messages[19]?.id : null,
		};
	},
	async edit(messageId: string, userId: string, content: string) {
		return db.$transaction(async (tx) => {
			const updated = await tx.message.updateMany({
				where: {
					id: messageId,
					sender: { userId },
					deletedBy: { none: { deleteType: "EVERYONE" } },
				},
				data: { content, editedAt: new Date() },
			});
			return updated.count
				? tx.message.findUniqueOrThrow({ where: { id: messageId }, include })
				: null;
		});
	},
	async hide(messageId: string, participantId: string, chatId: string) {
		const message = await db.message.findFirst({
			where: { id: messageId, chatId },
			select: { id: true },
		});
		if (!message) return null;
		return db.messageDelete.upsert({
			where: {
				chatParticipantId_messageId: {
					chatParticipantId: participantId,
					messageId,
				},
			},
			create: {
				chatParticipantId: participantId,
				messageId,
				deleteType: "SELF",
			},
			update: {},
		});
	},
	async unsend(messageId: string, userId: string) {
		return db.$transaction(async (tx) => {
			const message = await tx.message.findFirst({
				where: { id: messageId, sender: { userId } },
				include: { MessageAttachment: true },
			});
			if (!message) return null;
			await tx.messageAttachment.deleteMany({ where: { messageId } });
			await tx.react.deleteMany({ where: { messageId } });
			await tx.messageDelete.upsert({
				where: {
					chatParticipantId_messageId: {
						chatParticipantId: message.senderId,
						messageId,
					},
				},
				create: {
					chatParticipantId: message.senderId,
					messageId,
					deleteType: "EVERYONE",
				},
				update: { deleteType: "EVERYONE" },
			});
			const removed = await tx.message.update({
				where: { id: messageId },
				data: { content: null },
				include,
			});
			return {
				message: removed,
				attachmentUrls: message.MessageAttachment.map(
					(attachment) => attachment.attachmentUrl,
				),
			};
		});
	},
	getReactionContext(messageId: string, userId: string) {
		return db.message.findFirst({
			where: {
				id: messageId,
				deletedBy: {
					none: {
						OR: [
							{ deleteType: "EVERYONE" },
							{ deleteType: "SELF", chatParticipant: { userId } },
						],
					},
				},
				chat: { chatParticipants: { some: { userId } } },
			},
			select: {
				chatId: true,
				chat: {
					select: {
						chatParticipants: { where: { userId }, select: { id: true } },
					},
				},
			},
		});
	},
	async setReaction(
		messageId: string,
		reactedById: string,
		emoji: string | null,
	) {
		if (emoji === null) {
			await db.react.deleteMany({ where: { messageId, reactedById } });
			return null;
		}
		return db.react.upsert({
			where: { reactedById_messageId: { reactedById, messageId } },
			create: { messageId, reactedById, emoji },
			update: { emoji },
		});
	},
	async markChatAsSeen(chatId: string, participantId: string) {
		return db.$transaction(async (tx) => {
			const unread = await tx.message.findMany({
				where: {
					chatId,
					senderId: { not: participantId },
					deletedBy: {
						none: {
							OR: [
								{ deleteType: "EVERYONE" },
								{ deleteType: "SELF", chatParticipantId: participantId },
							],
						},
					},
					seenBy: { none: { chatParticipantId: participantId } },
				},
				select: { id: true },
			});
			if (!unread.length) return [];
			await tx.messageSeen.createMany({
				data: unread.map(({ id }) => ({
					messageId: id,
					chatParticipantId: participantId,
				})),
				skipDuplicates: true,
			});
			return tx.messageSeen.findMany({
				where: {
					messageId: { in: unread.map(({ id }) => id) },
					chatParticipantId: participantId,
				},
			});
		});
	},
	async createManyMessageSeen(
		messageIds: string[],
		chatParticipantId: string,
		chatId: string,
	) {
		const ids = [...new Set(messageIds)];
		const valid = await db.message.findMany({
			where: {
				id: { in: ids },
				chatId,
				senderId: { not: chatParticipantId },
				...visible(chatParticipantId),
			},
			select: { id: true },
		});
		if (valid.length !== ids.length) return null;
		await db.messageSeen.createMany({
			data: ids.map((messageId) => ({ messageId, chatParticipantId })),
			skipDuplicates: true,
		});
		return db.messageSeen.findMany({
			where: { messageId: { in: ids }, chatParticipantId },
		});
	},
});
