import type { Chat, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { CreateChatParams } from "../schemas/chat.schemas";
import CreteRepository, { type Repository } from "./base.repository";

export type ChatListType = {
	title: string;
	id: string;
	image: string | null;
	lastMessage: string;
	name: string | null;
	lastMessageSentBy: string;
	time: string | null;
	unseenMessageCount: number;
};

export type ChatRepository = Repository & {
	createChat: (params: CreateChatParams) => Promise<Chat | null>;
	getChatBetweenUsers: (params: CreateChatParams) => Promise<Chat | null>;
	getUserChats: (userId: string) => Promise<ChatListType[] | null>;
};

const CreateChatRepository = (db: PrismaClient): ChatRepository => {
	return {
		...CreteRepository(db.chat),
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
					return (
						participantIds.length === 1 &&
						participantIds[0] === user1Id
					);
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
			try {
				const participantIds =
					user1Id === user2Id
						? [user1Id]
						: [user1Id, user2Id];

				const chat = await db.chat.create({
					data: {
						title: "",
						chatParticipants: {
							create: participantIds.map((userId) => ({
								userId,
							})),
						},
					},
					include: {
						chatParticipants: true,
					},
				});

				return chat;
			} catch (error) {
				console.log("Error while creating chat: ", error);

				throw new TRPCError({
					message: "Could not create chat",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
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
							userId: true,
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
			if (!chats)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No chats available for the user",
				});

			const chatListPromises = chats.map(async (chat) => {
				const otherParticipant = chat.chatParticipants.find(
					(p) => p.userId !== userId,
				);

				const [unseenMessageCount, lastMessage] = await Promise.all([
					db.message.count({
						where: {
							chatId: chat.id,
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
						where: { chatId: chat.id },
						orderBy: { createdAt: "desc" },
					}),
				]);

				return {
					id: chat.id,
					title: chat.title,
					image: otherParticipant?.user.image || null,
					name: otherParticipant?.user.name || null,
					unseenMessageCount: unseenMessageCount,
					time: lastMessage?.createdAt?.toISOString() || null,
					lastMessageSentBy: lastMessage?.senderId || "",
					lastMessage: lastMessage?.content || "",
				};
			});
			const chatList = await Promise.all(chatListPromises);
			return chatList;
		},
	};
};

export default CreateChatRepository;
