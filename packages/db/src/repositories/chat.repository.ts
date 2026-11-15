import type { PrismaClient } from "@prisma/client";
import type { CreateChatParams } from "../schemas/chat.schemas";
import CreteRepository from "./base.repository";

const CreateChatRepository = (db: PrismaClient) => {
	const getBlockStatus = async (chatId: string, userId: string) => {
		const peers = await db.chatParticipant.findMany({
			where: { chatId, userId: { not: userId } },
			select: { userId: true },
		});
		const ids = peers.map((peer) => peer.userId);
		const blocks = await db.userBlock.findMany({
			where: {
				OR: [
					{ blockerId: userId, blockedId: { in: ids } },
					{ blockedId: userId, blockerId: { in: ids } },
				],
			},
		});
		return {
			isBlocked: blocks.length > 0,
			blockedByMe: blocks.some((block) => block.blockerId === userId),
		};
	};
	return {
		...CreteRepository(db.chat),
		getBlockStatus,
		getBlockedUsers: async (userId: string) =>
			(
				await db.userBlock.findMany({
					where: { blockerId: userId },
					orderBy: { createdAt: "desc" },
					select: {
						blocked: {
							select: { id: true, name: true, username: true, image: true },
						},
					},
				})
			).map((entry) => entry.blocked),
		getActivity: async (userId: string) => {
			const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const visible = {
				createdAt: { gte: since },
				chat: { chatParticipants: { some: { userId } } },
				deletedBy: {
					none: {
						OR: [
							{ deleteType: "EVERYONE" as const },
							{ deleteType: "SELF" as const, chatParticipant: { userId } },
						],
					},
				},
			};
			const [sent, received] = await Promise.all([
				db.message.count({ where: { ...visible, sender: { userId } } }),
				db.message.count({
					where: { ...visible, sender: { userId: { not: userId } } },
				}),
			]);
			return { sent, received };
		},
		getParticipantUserIds: async (chatId: string) =>
			(
				await db.chatParticipant.findMany({
					where: { chatId },
					select: { userId: true },
				})
			).map((participant) => participant.userId),
		removeForUser: (chatId: string, userId: string) =>
			db.chatParticipant.update({
				where: { userId_chatId: { userId, chatId } },
				data: { removedAt: new Date() },
			}),
		reopenForUser: (chatId: string, userId: string) =>
			db.chatParticipant.update({
				where: { userId_chatId: { userId, chatId } },
				data: { removedAt: null },
			}),
		setBlocked: async (
			userId: string,
			otherUserId: string,
			blocked: boolean,
		) => {
			if (blocked)
				return db.userBlock.upsert({
					where: {
						blockerId_blockedId: { blockerId: userId, blockedId: otherUserId },
					},
					create: { blockerId: userId, blockedId: otherUserId },
					update: {},
				});
			return db.userBlock.deleteMany({
				where: { blockerId: userId, blockedId: otherUserId },
			});
		},
		getChatBetweenUsers: async ({ user1Id, user2Id }: CreateChatParams) => {
			const chats = await db.chat.findMany({
				where: {
					chatParticipants: {
						some: {
							userId: user1Id,
						},
					},
				},
				include: {
					chatParticipants: true,
				},
			});

			const chat = chats.find((c) => {
				const participantIds = c.chatParticipants.map((p) => p.userId);

				if (user1Id === user2Id) {
					return participantIds.length === 1 && participantIds[0] === user1Id;
				}

				return (
					participantIds.length === 2 &&
					participantIds.includes(user1Id) &&
					participantIds.includes(user2Id)
				);
			});

			return chat ?? null;
		},
		createChat: async ({ user1Id, user2Id }: CreateChatParams) => {
			const participantIds =
				user1Id === user2Id ? [user1Id] : [user1Id, user2Id];

			return db.chat.create({
				data: {
					title: "",
					chatParticipants: {
						create: participantIds.map((userId) => ({ userId })),
					},
				},
				include: {
					chatParticipants: true,
				},
			});
		},
		getUserChats: async (userId: string) => {
			const chats = await db.chat.findMany({
				where: {
					chatParticipants: {
						some: { userId: userId },
					},
				},
				include: {
					chatParticipants: {
						select: {
							id: true,
							userId: true,
							removedAt: true,
							user: {
								select: {
									image: true,
									name: true,
								},
							},
						},
					},
				},
			});
			const blocks = await db.userBlock.findMany({
				where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
			});
			const blockedByMe = new Set(
				blocks
					.filter((block) => block.blockerId === userId)
					.map((block) => block.blockedId),
			);
			const blockedMe = new Set(
				blocks
					.filter((block) => block.blockedId === userId)
					.map((block) => block.blockerId),
			);
			const chatListPromises = chats.map(async (chat) => {
				const otherParticipant = chat.chatParticipants.find(
					(p) => p.userId !== userId,
				);

				const [unseenMessageCount, lastMessage] = await Promise.all([
					db.message.count({
						where: {
							chatId: chat.id,
							sender: { userId: { not: userId } },
							deletedBy: {
								none: {
									OR: [
										{ deleteType: "EVERYONE" },
										{ deleteType: "SELF", chatParticipant: { userId } },
									],
								},
							},
							NOT: {
								seenBy: {
									some: {
										chatParticipant: { userId },
									},
								},
							},
						},
					}),
					db.message.findFirst({
						where: {
							chatId: chat.id,
							deletedBy: {
								none: { deleteType: "SELF", chatParticipant: { userId } },
							},
						},
						include: { deletedBy: true },
						orderBy: { createdAt: "desc" },
					}),
				]);

				const ownParticipant = chat.chatParticipants.find(
					(participant) => participant.userId === userId,
				);
				if (
					ownParticipant?.removedAt &&
					(!lastMessage || lastMessage.createdAt <= ownParticipant.removedAt)
				)
					return null;
				return {
					id: chat.id,
					otherUserId: otherParticipant?.userId ?? null,
					blockedByMe:
						!!otherParticipant && blockedByMe.has(otherParticipant.userId),
					isBlocked:
						!!otherParticipant &&
						(blockedByMe.has(otherParticipant.userId) ||
							blockedMe.has(otherParticipant.userId)),
					participantId:
						chat.chatParticipants.find((p) => p.userId === userId)?.id ?? "",
					title: chat.title,
					image: otherParticipant?.user.image || null,
					name: otherParticipant?.user.name || null,
					unseenMessageCount,
					time: lastMessage?.createdAt?.toISOString() || null,
					lastMessageSentBy: lastMessage?.senderId || "",
					lastMessageId: lastMessage?.id,
					lastMessage: lastMessage?.deletedBy.some(
						(deleted) => deleted.deleteType === "EVERYONE",
					)
						? "Message unsent"
						: lastMessage?.content ||
							(lastMessage?.messageType === "IMAGE"
								? "Photo"
								: lastMessage?.messageType === "VIDEO"
									? "Video"
									: ""),
				};
			});
			const chatList = await Promise.all(chatListPromises);
			return chatList
				.filter((item) => item !== null)
				.sort(
					(a, b) =>
						new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime(),
				);
		},
		getChatById: async ({
			userId,
			chatId,
		}: {
			chatId: string;
			userId: string;
		}) => {
			const chat = await db.chat.findUniqueOrThrow({
				where: { id: chatId, chatParticipants: { some: { userId } } },
				include: {
					chatParticipants: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									image: true,
								},
							},
						},
					},
					messages: {
						orderBy: { createdAt: "desc" },
						take: 1,
						include: {
							sender: {
								include: {
									user: {
										select: {
											name: true,
											id: true,
											image: true,
										},
									},
								},
							},
						},
					},
				},
			});
			return {
				...(await getBlockStatus(chatId, userId)),
				id: chat.id,
				title: chat.title,
				chatName:
					chat.chatParticipants.find((p) => p.userId !== userId)?.user.name ||
					null,
				chatParticipants: chat.chatParticipants,
				messages: chat.messages,
				lastMessage: chat.messages[0] || null,
				lastMessageTime: chat.messages[0]?.createdAt || null,
			};
		},
	};
};

export default CreateChatRepository;
