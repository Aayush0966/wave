import { useEffect, useRef } from "react";
import { useChatStore } from "../chat.store";
import type { MessageFull } from "@wave/db";
import type { MessageSeen } from "@prisma/client";

type SharedChatRoomOptions = {
  chatId: string;
  senderId: string;
  messages: MessageFull[];
  isFocused: boolean;
  pusherClient: any;
  onMarkAsSeen: (messageIds: string[]) => void;
};

export function useSharedChatRoom({
  chatId,
  senderId,
  messages,
  isFocused,
  pusherClient,
  onMarkAsSeen,
}: SharedChatRoomOptions) {
  const onMarkAsSeenRef = useRef(onMarkAsSeen);
  onMarkAsSeenRef.current = onMarkAsSeen;

  // Check and mark unseen messages when focus or messages list updates
  useEffect(() => {
    if (!isFocused) return;

    const unseenMessages = messages.filter(
      (m) =>
        m.senderId !== senderId &&
        !m.seenBy?.some((s) => s.chatParticipantId === senderId)
    );

    if (unseenMessages.length === 0) return;

    onMarkAsSeenRef.current(unseenMessages.map((m) => m.id));
  }, [isFocused, messages, senderId]);

  // Bind Pusher events
  useEffect(() => {
    const channelName = `chat-${chatId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", (message: MessageFull) => {
      if (message.senderId === senderId) return;
      useChatStore.getState().addMessage(message);

      if (isFocused) {
        onMarkAsSeenRef.current([message.id]);
      }
    });

    channel.bind("message-seen", (data: MessageSeen) => {
      if (data.chatParticipantId === senderId) return;
      useChatStore.getState().markMessageAsSeen(data);
    });

    channel.bind("messages-seen", (data: MessageSeen[]) => {
      const filtered = data.filter((m) => m.chatParticipantId !== senderId);
      if (filtered.length > 0) {
        useChatStore.getState().markAllMessagesAsSeen(filtered);
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [chatId, senderId, isFocused, pusherClient]);
}
