import { create } from "zustand";
import { devtools } from "zustand/middleware";

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

export type Message = {
  id: string;
  messageType: "TEXT" | "ATTACHMENT" | "IMAGE" | "VIDEO";
  senderId: string;
  content: string | null;
  chatId: string;
  messageStatus: "PENDING" | "SENT" | "DELIVERED" | "READ";
  createdAt: Date;
  updatedAt: Date;
};

type ChatStore = {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  messagesById: Record<string, Message>;
  chatMessages: Record<string, string[]>;
  sendMessage: (message: Message) => void;
  addMessage: (message: Message) => void;
  replaceMessage: (message: Message, tempId: string) => void;
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
  })),
);
