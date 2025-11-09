import type { Chat } from "@prisma/client";
import type { ChatRepository, CreateChatParams } from "@wave/db";

export type ChatService = {
	createChat: (params: CreateChatParams) => Promise<Chat | null>;
	getUserChats: (
		userId: string,
	) => Promise<Awaited<ReturnType<ChatRepository["getUserChats"]>>>;
};

export const CreateChatService = (repo: ChatRepository): ChatService => {
	return {
		async createChat({ user1Id, user2Id }: CreateChatParams) {
			const existingChat = await repo.getChatBetweenUsers({ user1Id, user2Id });
			if (existingChat) return existingChat;
			const chat = await repo.createChat({ user1Id, user2Id });
			return chat;
		},
		async getUserChats(userId: string) {
			const chats = await repo.getUserChats(userId);
			return chats;
		},
	};
};
