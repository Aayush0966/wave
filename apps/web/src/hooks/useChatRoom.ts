import { useEffect, useState, useCallback } from "react";
import { useSharedChatRoom } from "@wave/state";
import { pusherClient } from "@/lib/pusher-client";
import { trpc } from "@/lib/trpc-client";
import type { MessageFull } from "@wave/db";

export function useChatRoom(
  chatId: string,
  senderId: string,
  messages: MessageFull[]
) {
  const [isFocused, setIsFocused] = useState(() =>
    typeof document !== "undefined" ? document.hasFocus() : true
  );

  const markSeenMutation = trpc.message.createManyMessageSeen.useMutation();

  useEffect(() => {
    setIsFocused(document.hasFocus());

    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const handleMarkAsSeen = useCallback(
    (messageIds: string[]) => {
      markSeenMutation.mutate({
        chatId,
        chatParticipantId: senderId,
        messageIds,
      });
    },
    [chatId, senderId, markSeenMutation]
  );

  useSharedChatRoom({
    chatId,
    senderId,
    messages,
    isFocused,
    pusherClient,
    onMarkAsSeen: handleMarkAsSeen,
  });
}
