"use client";

import type { Message as MessageType } from "@prisma/client";
import { useChatStore } from "@wave/state";
import GhostAnimation from "../GhostAnimation";
import Message from "./Message";

type MessageListType = {
  initialMessages: MessageType[];
  senderId: string;
  chatId: string;
};

const EMPTY_MESSAGE_IDS: string[] = [];

const MessageList = ({ initialMessages, senderId, chatId }: MessageListType) => {
  const messageIds = useChatStore(
    (state) => state.chatMessages[chatId] ?? EMPTY_MESSAGE_IDS,
  );
  const messagesById = useChatStore((state) => state.messagesById);
  const optimisticMessages = messageIds
    .map((messageId) => messagesById[messageId])
    .filter((message): message is NonNullable<typeof message> => Boolean(message));
  const messages = [...initialMessages, ...optimisticMessages];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-6 sm:px-8">
      {messages.length ? (
        messages.map((message) => (
          <Message key={message.id} message={message} currentUserId={senderId} />
        ))
      ) : (
        <div className="m-auto max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
          No messages yet. Start the conversation below.
          <GhostAnimation />
        </div>
      )}

    </div>
  )
}


export default MessageList
