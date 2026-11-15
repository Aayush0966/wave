import type { MessageSeen } from "@prisma/client";
import type { MessageFull, MessageReactionUpdate } from "@wave/db";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Chat = {
	id: string;
	participantId: string;
	otherUserId: string | null;
	isBlocked: boolean;
	blockedByMe: boolean;
	title: string;
	image: string | null;
	lastMessage: string;
	lastMessageId?: string;
	name: string | null;
	lastMessageSentBy: string;
	time: string | null;
	unseenMessageCount: number;
};

const sortChats = (chats: Chat[]) =>
	[...chats].sort(
		(a, b) =>
			(new Date(b.time ?? 0).getTime() || 0) -
			(new Date(a.time ?? 0).getTime() || 0),
	);

type ChatStore = {
	messageFocus: { chatId: string; messageId: string; requestId: number } | null;
	focusMessage: (chatId: string, messageId: string) => void;
	chats: Chat[];
	hiddenMessageIds: Record<string, boolean>;
	replyDrafts: Record<string, MessageFull | null>;
	editDrafts: Record<string, MessageFull | null>;
	presenceByChat: Record<string, string[]>;
	typingByChat: Record<
		string,
		Record<string, { name: string; expiresAt: number }>
	>;
	connectionState: string;
	syncState: Record<string, string>;
	setReplyDraft: (chatId: string, message: MessageFull | null) => void;
	setEditDraft: (chatId: string, message: MessageFull | null) => void;
	setPresence: (chatId: string, ids: string[]) => void;
	setTyping: (
		chatId: string,
		participantId: string,
		name: string,
		typing: boolean,
	) => void;
	mergeMessages: (
		chatId: string,
		messages: MessageFull[],
		participantId: string,
	) => void;
	updateMessage: (message: MessageFull) => void;
	hideMessage: (chatId: string, messageId: string) => void;
	setChats: (chats: Chat[]) => void;
	addChat: (chat: Chat) => void;
	messagesById: Record<string, MessageFull>;
	chatMessages: Record<string, string[]>;
	removePendingMessage: (messageId: string) => void;
	applyUnsentMessage: (message: MessageFull) => void;
	sendMessage: (message: MessageFull) => void;
	addMessage: (message: MessageFull) => void;
	replaceMessage: (message: MessageFull, tempId: string) => void;
	applyMessageReaction: (update: MessageReactionUpdate) => void;
	markMessageAsSeen: (seenRecord: MessageSeen) => void;
	markAllMessagesAsSeen: (seenRecord: MessageSeen[]) => void;
	prependMessages: (chatId: string, olderMessages: MessageFull[]) => void;
	setInitialMessages: (chatId: string, messages: MessageFull[]) => void;
	incrementUnreadCount: (
		chatId: string,
		count?: number,
		lastMessage?: MessageFull,
	) => void;
	resetUnreadCount: (chatId: string) => void;
};

export const useChatStore = create<ChatStore>()(
	devtools((set, get) => ({
		messageFocus: null,
		focusMessage: (chatId, messageId) =>
			set((state) => ({
				messageFocus: {
					chatId,
					messageId,
					requestId: (state.messageFocus?.requestId ?? 0) + 1,
				},
			})),
		chats: [],
		hiddenMessageIds: {},
		replyDrafts: {},
		editDrafts: {},
		presenceByChat: {},
		typingByChat: {},
		connectionState: "connecting",
		syncState: {},
		setReplyDraft: (chatId, message) =>
			set((state) => ({
				replyDrafts: { ...state.replyDrafts, [chatId]: message },
				editDrafts: { ...state.editDrafts, [chatId]: null },
			})),
		setEditDraft: (chatId, message) =>
			set((state) => ({
				editDrafts: { ...state.editDrafts, [chatId]: message },
				replyDrafts: { ...state.replyDrafts, [chatId]: null },
			})),
		setPresence: (chatId, ids) =>
			set((state) => ({
				presenceByChat: { ...state.presenceByChat, [chatId]: ids },
			})),
		setTyping: (chatId, participantId, name, typing) =>
			set((state) => {
				const participants = { ...state.typingByChat[chatId] };
				if (typing)
					participants[participantId] = { name, expiresAt: Date.now() + 5000 };
				else delete participants[participantId];
				return {
					typingByChat: { ...state.typingByChat, [chatId]: participants },
				};
			}),
		hideMessage: (chatId, messageId) =>
			set((state) => ({
				hiddenMessageIds: { ...state.hiddenMessageIds, [messageId]: true },
				chatMessages: {
					...state.chatMessages,
					[chatId]: (state.chatMessages[chatId] ?? []).filter(
						(id) => id !== messageId,
					),
				},
				replyDrafts: {
					...state.replyDrafts,
					[chatId]:
						state.replyDrafts[chatId]?.id === messageId
							? null
							: (state.replyDrafts[chatId] ?? null),
				},
				editDrafts: {
					...state.editDrafts,
					[chatId]:
						state.editDrafts[chatId]?.id === messageId
							? null
							: (state.editDrafts[chatId] ?? null),
				},
			})),
		updateMessage: (message) =>
			set((state) => {
				const prior = state.messagesById[message.id];
				const unsent = message.deletedBy.some(
					(deleted) => deleted.deleteType === "EVERYONE",
				);
				if (
					prior &&
					((prior.deletedBy.some(
						(deleted) => deleted.deleteType === "EVERYONE",
					) &&
						!unsent) ||
						new Date(prior.updatedAt).getTime() >
							new Date(message.updatedAt).getTime())
				)
					return state;
				const messagesById = { ...state.messagesById, [message.id]: message };
				for (const [id, existing] of Object.entries(messagesById)) {
					if (existing.replyToId === message.id)
						messagesById[id] = {
							...existing,
							replyTo: message.deletedBy.some(
								(item) => item.deleteType === "EVERYONE",
							)
								? null
								: {
										id: message.id,
										content: message.content,
										messageType: message.messageType,
										senderId: message.senderId,
										deletedBy: message.deletedBy,
									},
						};
				}
				return {
					messagesById,
					replyDrafts:
						unsent && state.replyDrafts[message.chatId]?.id === message.id
							? { ...state.replyDrafts, [message.chatId]: null }
							: state.replyDrafts,
					editDrafts:
						unsent && state.editDrafts[message.chatId]?.id === message.id
							? { ...state.editDrafts, [message.chatId]: null }
							: state.editDrafts,
					chats: state.chats.map((chat) =>
						chat.lastMessageId === message.id
							? {
									...chat,
									lastMessage: unsent
										? "Message unsent"
										: message.content ||
											(message.messageType === "IMAGE"
												? "Photo"
												: message.messageType === "VIDEO"
													? "Video"
													: ""),
								}
							: chat,
					),
				};
			}),
		mergeMessages: (chatId, messages, participantId) => {
			for (const message of messages) {
				if (
					message.deletedBy.some(
						(deleted) =>
							deleted.deleteType === "SELF" &&
							deleted.chatParticipantId === participantId,
					)
				) {
					get().hideMessage(chatId, message.id);
					continue;
				}
				if (get().hiddenMessageIds[message.id]) continue;
				get().updateMessage(message);
			}
			set((state) => ({
				chatMessages: {
					...state.chatMessages,
					[chatId]: [
						...new Set([
							...(state.chatMessages[chatId] ?? []),
							...messages.map((message) => message.id),
						]),
					]
						.filter((id) => !state.hiddenMessageIds[id])
						.sort(
							(a, b) =>
								new Date(state.messagesById[a]?.createdAt ?? 0).getTime() -
									new Date(state.messagesById[b]?.createdAt ?? 0).getTime() ||
								a.localeCompare(b),
						),
				},
			}));
		},
		messagesById: {},
		chatMessages: {},
		setChats: (chats) => set({ chats: sortChats(chats) }),
		addChat: (chat) => set({ chats: sortChats([...get().chats, chat]) }),
		removePendingMessage: (messageId) =>
			set((state) => {
				const message = state.messagesById[messageId];
				if (!message || !messageId.startsWith("temp-")) return state;
				const messagesById = { ...state.messagesById };
				delete messagesById[messageId];
				return {
					messagesById,
					chatMessages: {
						...state.chatMessages,
						[message.chatId]: (state.chatMessages[message.chatId] ?? []).filter(
							(id) => id !== messageId,
						),
					},
				};
			}),
		applyUnsentMessage: (message) => {
			get().updateMessage(message);
			set((state) => ({
				messagesById: { ...state.messagesById, [message.id]: message },
				chats: state.chats.map((chat) =>
					chat.id === message.chatId && chat.lastMessageId === message.id
						? { ...chat, lastMessage: "Message unsent" }
						: chat,
				),
			}));
		},
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
						[message.chatId]: Array.from(
							new Set(
								messageIds.map((messageId) =>
									messageId === tempId ? message.id : messageId,
								),
							),
						),
					},
				};
			}),
		addMessage: (message) => {
			const currentState = get();
			if (
				currentState.hiddenMessageIds[message.id] ||
				currentState.chatMessages[message.chatId]?.includes(message.id)
			)
				return;
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
		applyMessageReaction: ({ messageId, reactedById, reaction }) =>
			set((state) => {
				const message = state.messagesById[messageId];
				if (
					!message ||
					message.deletedBy.some((item) => item.deleteType === "EVERYONE")
				)
					return state;
				const reacts = message.reacts.filter(
					(item) => item.reactedById !== reactedById,
				);
				if (reaction) reacts.push(reaction);
				return {
					messagesById: {
						...state.messagesById,
						[messageId]: { ...message, reacts },
					},
				};
			}),
		markMessageAsSeen: (seenRecord: MessageSeen) => {
			set((state) => {
				const message = state.messagesById[seenRecord.messageId];
				if (!message) return state;
				const alreadySeen = message.seenBy.some(
					(s: MessageSeen) =>
						s.chatParticipantId === seenRecord.chatParticipantId,
				);
				if (alreadySeen) return state;
				return {
					messagesById: {
						...state.messagesById,
						[seenRecord.messageId]: {
							...message,
							seenBy: [...(message.seenBy ?? []), seenRecord],
						},
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
						(s: MessageSeen) =>
							s.chatParticipantId === seenRecord.chatParticipantId,
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
		prependMessages: (chatId: string, olderMessages: MessageFull[]) => {
			set((state) => {
				const existingMessagesIds = state.chatMessages[chatId] ?? [];
				const newMessagesById = { ...state.messagesById };
				const incomingMessagesIds: string[] = [];
				olderMessages.forEach((message) => {
					if (state.hiddenMessageIds[message.id]) return;
					const cached = state.messagesById[message.id];
					newMessagesById[message.id] = cached?.deletedBy.some(
						(deleted) => deleted.deleteType === "EVERYONE",
					)
						? cached
						: message;

					if (!existingMessagesIds.includes(message.id)) {
						incomingMessagesIds.push(message.id);
					}
				});

				return {
					messagesById: newMessagesById,
					chatMessages: {
						...state.chatMessages,
						[chatId]: [...incomingMessagesIds, ...existingMessagesIds],
					},
				};
			});
		},
		setInitialMessages: (chatId: string, messages: MessageFull[]) =>
			set((state) => {
				const existingIds = state.chatMessages[chatId];
				// If the store already has messages for this chat, don't overwrite them
				if (existingIds && existingIds.length > 0) return state;

				const newMessagesById = { ...state.messagesById };
				const ids: string[] = [];

				messages.forEach((msg) => {
					if (state.hiddenMessageIds[msg.id]) return;
					newMessagesById[msg.id] = msg;
					ids.push(msg.id);
				});

				return {
					messagesById: newMessagesById,
					chatMessages: {
						...state.chatMessages,
						[chatId]: ids,
					},
				};
			}),

		resetUnreadCount: (chatId: string) =>
			set((state) => {
				if (
					!state.chats.some(
						(chat) => chat.id === chatId && chat.unseenMessageCount > 0,
					)
				)
					return state;
				return {
					chats: state.chats.map((chat) =>
						chat.id === chatId
							? {
									...chat,
									unseenMessageCount: 0,
								}
							: chat,
					),
				};
			}),

		incrementUnreadCount: (
			chatId: string,
			count = 1,
			latestMessage?: MessageFull,
		) =>
			set((state) => ({
				chats: sortChats(
					state.chats.map((chat) => {
						if (chat.id !== chatId) return chat;
						return {
							...chat,
							unseenMessageCount: (chat.unseenMessageCount ?? 0) + count,
							...(latestMessage &&
								(!chat.time ||
									new Date(latestMessage.createdAt).getTime() >=
										new Date(chat.time).getTime()) && {
									lastMessage:
										latestMessage.content ||
										(latestMessage.messageType === "IMAGE"
											? "Photo"
											: latestMessage.messageType === "VIDEO"
												? "Video"
												: ""),
									lastMessageId: latestMessage.id,
									lastMessageSentBy: latestMessage.senderId,
									time: new Date(latestMessage.createdAt).toISOString(),
								}),
						};
					}),
				),
			})),
	})),
);
