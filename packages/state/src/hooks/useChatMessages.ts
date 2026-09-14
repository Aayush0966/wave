import { useMemo } from "react";
import { useChatStore } from "../chat.store";
import type { MessageFull } from "@wave/db";

const EMPTY_MESSAGE_IDS: string[] = [];

export function useChatMessages(chatId: string, initialMessages: MessageFull[]) {
  const messageIds = useChatStore(
    (s) => s.chatMessages[chatId] ?? EMPTY_MESSAGE_IDS
  );
  const messagesById = useChatStore((s) => s.messagesById);

  return useMemo(() => {
    // Type predicate: (msg): msg is MessageFull => Boolean(msg)
    const storeMsgs = messageIds
      .map((id) => messagesById[id])
      .filter((msg): msg is MessageFull => Boolean(msg));

    const combined = [...initialMessages, ...storeMsgs];
    if (combined.length === 0) return [];

    const map = new Map<string, MessageFull>();
    combined.forEach((msg) => map.set(msg.id, msg));
    
    return Array.from(map.values());
  }, [initialMessages, messageIds, messagesById]);
}
