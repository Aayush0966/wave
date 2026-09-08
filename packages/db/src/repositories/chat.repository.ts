import type { Chat, PrismaClient, Message } from "@prisma/client";
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

export type ChatDetailsType = {
	id: string;
	title: string;
	chatName: string | null;
	lastMessage: Message | null;
	chatParticipants: {
		userId: string;
		user: {
			id: string;
			name: string | null;
			image: string | null;
		};
	}[];
	messages: {
		id: string;
		content: string | null;
		senderId: string;
		createdAt: Date | null;
		sender: {
			user: {
				id: string;
				name: string | null;
				image: string | null;
			}
		};
	}[];
	lastMessageTime: Date | null;
};

export type ChatRepository = Repository & {
	createChat: (params: CreateChatParams) => Promise<Chat | null>;
	getChatBetweenUsers: (params: CreateChatParams) => Promise<Chat | null>;
	getUserChats: (userId: string) => Promise<ChatListType[] | null>;
	getChatById: (params: { chatId: string; userId: string }) => Promise<ChatDetailsType | null>;
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
					unseenMessageCount,
					time: lastMessage?.createdAt?.toISOString() || null,
					lastMessageSentBy: lastMessage?.senderId || "",
					lastMessage: lastMessage?.content || "",
				};
			});
			const chatList = await Promise.all(chatListPromises);
			return chatList;
		},
		getChatById: async ({ userId, chatId }: { chatId: string; userId: string }): Promise<ChatDetailsType | null> => {
			const chat = await db.chat.findUniqueOrThrow({
				where: { id: chatId },
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
										}
									}
								},
							}
						},
					},
				}
			});
			return {
				id: chat.id,
				title: chat.title,
				chatName: chat.chatParticipants.find((p) => p.userId !== userId)?.user.name || null,
				chatParticipants: chat.chatParticipants,
				messages: chat.messages,
				lastMessage: chat.messages[0] || null,
				lastMessageTime: chat.messages[0]?.createdAt || null,
			};
		}
	};
};

export default CreateChatRepository;
