import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Chat } from "@/types/chat";
import type { Message } from "@/types/message";

type ChatStore = {
	chats: Chat[];
	setChats: (chats: Chat[]) => void;
	addChat: (chat: Chat) => void;
	messagesById: Record<string, Message>;
	chatMessages: Record<string, string[]>;
	sendMessage: (message: Message) => void;
	addMessage: (message: Message) => void;
};

export const useChatStore = create<ChatStore>()(
	devtools((set, get) => ({
		chats: [],
		messagesById: {},
		chatMessages: {},
		setChats: (chats) => set({ chats }),
		addChat: (chat) => set({ chats: [...get().chats, chat] }),
		addMessage: (message) => {
			set({
				messagesById: { ...get().messagesById, [message.id]: message },
				chatMessages: {
					...get().chatMessages,
					[message.chatId]: [
						...(get().chatMessages[message.chatId] || []),
						message.id,
					],
				},
				chats: {
					...get().chats.map((chat) =>
						chat.id === message.id
							? {
									...chat,
									lastMessage: message.content,
									unseenMessageCount: message.unseenMessageCount + 1,
								}
							: chat,
					),
				},
			});
		},
	})),
);
