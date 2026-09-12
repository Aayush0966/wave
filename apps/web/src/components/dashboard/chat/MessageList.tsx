"use client";

import type { Message as MessageType } from "@prisma/client";
import { useChatStore } from "@wave/state";
import GhostAnimation from "../GhostAnimation";
import Message from "./Message";
import { pusherClient } from "@/lib/pusher-client";
import { useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc-client";

type MessageListType = {
  initialMessages: MessageType[];
  senderId: string;
  chatId: string;
};

const EMPTY_MESSAGE_IDS: string[] = [];

const MessageList = ({ initialMessages, senderId, chatId }: MessageListType) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageIds = useChatStore(
    (state) => state.chatMessages[chatId] ?? EMPTY_MESSAGE_IDS,
  );
  const messagesById = useChatStore((state) => state.messagesById);

  const storeMessages = useMemo(() => {
    return messageIds
      .map((messageId) => messagesById[messageId])
      .filter((message): message is NonNullable<typeof message> => Boolean(message));
  }, [messageIds, messagesById]);

  // Merge initial and store messages while removing duplicates by message ID
  const messages = useMemo(() => {
    const combined = [...initialMessages, ...storeMessages];
    const map = new Map<string, MessageType>();
    combined.forEach((msg) => map.set(msg.id, msg));
    return Array.from(map.values());
  }, [initialMessages, storeMessages]);


  const markMessageAsSeen = trpc.message.createMessageSeen.useMutation();

  useEffect(() => {
    const channelName = `chat-${chatId}`;
    const channel = pusherClient.subscribe(channelName);

    const handleNewMessage = (message: MessageType) => {
      if (message.senderId === senderId) return; // ignore self-sent messages

      useChatStore.getState().addMessage(message);
    };
    
    const handleMessageSeen = (data: { messageId: string; chatParticipantId: string }) => {
      if (data.chatParticipantId === senderId) return; // ignore self-seen messages
      useChatStore.getState().markMessageAsSeen(data.messageId, data.chatParticipantId);
    }
    const handleMessagesSeen = (data: { messageIds: string[]; chatParticipantId: string }) => {
      if (data.chatParticipantId === senderId) return; // ignore self-seen messages
     useChatStore.getState().markAllMessagesAsSeen(chatId, data.chatParticipantId);
    }

    channel.bind("new-message", handleNewMessage);
    channel.bind("message-seen", handleMessageSeen);
    channel.bind("messages-seen", handleMessagesSeen);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("message-seen", handleMessageSeen);
      channel.unbind("messages-seen", handleMessageSeen)
      pusherClient.unsubscribe(channelName);
    };
  }, [chatId, senderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
};

export default MessageList;
