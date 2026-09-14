import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MessageFull } from "@wave/db";
import type { MessageSeen } from "@prisma/client";

export type Chat = {
	id: string;
	title: string;
	image: string | null;
	lastMessage: string;
	name: string | null;
	lastMessageSentBy: string;
	time: string | null;
	unseenMessageCount: number;
};


type ChatStore = {
	chats: Chat[];
	setChats: (chats: Chat[]) => void;
	addChat: (chat: Chat) => void;
	messagesById: Record<string, MessageFull>;
	chatMessages: Record<string, string[]>;
	sendMessage: (message: MessageFull) => void;
	addMessage: (message: MessageFull) => void;
	replaceMessage: (message: MessageFull, tempId: string) => void;
	markMessageAsSeen: (seenRecord: MessageSeen) => void;
	markAllMessagesAsSeen: (seenRecord: MessageSeen[]) => void;
};

export const useChatStore = create<ChatStore>()(
	devtools((set, get) => ({
		chats: [],
		messagesById: {},
		chatMessages: {},
		setChats: (chats) => set({ chats }),
		addChat: (chat) => set({ chats: [...get().chats, chat] }),
		sendMessage: (message) => get().addMessage(message),
		replaceMessage: (message, tempId) =>
			set((state) => {
				const messageIds = state.chatMessages[message.chatId] ?? [];
				const messagesWithoutTemporary = { ...state.messagesById };
				delete messagesWithoutTemporary[tempId];
				return {
					messagesById: {
						...messagesWithoutTemporary,
						[message.id]: message,
					},
					chatMessages: {
						...state.chatMessages,
						[message.chatId]: messageIds.map((messageId) =>
							messageId === tempId ? message.id : messageId,
						),
					},
				};
			}),
		addMessage: (message) => {
			const currentState = get();
			set({
				messagesById: { ...currentState.messagesById, [message.id]: message },
				chatMessages: {
					...currentState.chatMessages,
					[message.chatId]: [
						...(currentState.chatMessages[message.chatId] ?? []),
						message.id,
					],
				},
			});
		},
		markMessageAsSeen: (seenRecord: MessageSeen) => {
			set((state) => {
				const message = state.messagesById[seenRecord.messageId];
				if (!message) return state;
				const alreadySeen = message.seenBy.some(
					(s) => s.chatParticipantId === seenRecord.chatParticipantId,
				);
				if (alreadySeen) return state;
				return {
					messagesById: {
						...state.messagesById,
						[seenRecord.messageId]: {
							...message,
							seenBy: [...(message.seenBy ?? []), seenRecord]
						}
					},
				};
			});
		},
		markAllMessagesAsSeen: (seenRecord: MessageSeen[]) => {
			set((state) => {
				const seenMap = new Map(seenRecord.map((s) => [s.messageId, s]));
				const updatedMessagesById = { ...state.messagesById };
				let stateChanged = false;

				seenMap.forEach((seenRecord, messageId) => {
					const message = updatedMessagesById[messageId];
					if (!message) return;
					const alreadySeen = message.seenBy.some(
						(s) => s.chatParticipantId === seenRecord.chatParticipantId,
					);
					if (!alreadySeen) {
						stateChanged = true;
						updatedMessagesById[messageId] = {
							...message,
							seenBy: [...message.seenBy, seenRecord],
						};
					}
				});
				if (!stateChanged) return state;
				return {
					messagesById: updatedMessagesById,
				};
			});
		},
	})),
);
