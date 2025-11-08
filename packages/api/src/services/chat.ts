import type { Chat } from "@prisma/client";
import type { ChatRepository, CreateChatParams } from "@wave/db";

export type ChatService = {
	createChat: (params: CreateChatParams) => Promise<Chat | null>;
};

export const CreateChatService = (repo: ChatRepository): ChatService => {
	return {
		async createChat({ user1Id, user2Id }: CreateChatParams) {
			const existingChat = repo.getChatBetweenUsers({ user1Id, user2Id });
			if (existingChat) return existingChat;
			const chat = repo.create({ user1Id, user2Id });
			return chat;
		},
	};
};
