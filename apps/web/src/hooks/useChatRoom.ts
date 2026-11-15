import type { MessageFull } from "@wave/db";
import { useChatStore, useSharedChatRoom } from "@wave/state";
import { useEffect, useRef, useState } from "react";
import { deserializeMessage } from "@/lib/deserialize-message";
import { pusherClient } from "@/lib/pusher-client";
import { trpc } from "@/lib/trpc-client";

export function useChatRoom(
	chatId: string,
	senderId: string,
	messages: MessageFull[],
) {
	const [isFocused, setIsFocused] = useState(false);
	const markSeen = trpc.message.createManyMessageSeen.useMutation({
		retry: 2,
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
	});
	const utils = trpc.useUtils();
	const active = useRef(true);
	useEffect(() => {
		active.current = true;
		const focus = () =>
			setIsFocused(
				document.hasFocus() && document.visibilityState === "visible",
			);
		focus();
		window.addEventListener("focus", focus);
		window.addEventListener("blur", focus);
		document.addEventListener("visibilitychange", focus);
		return () => {
			active.current = false;
			window.removeEventListener("focus", focus);
			window.removeEventListener("blur", focus);
			document.removeEventListener("visibilitychange", focus);
		};
	}, []);
	useSharedChatRoom({
		chatId,
		senderId,
		messages,
		isFocused,
		pusherClient,
		onMarkAsSeen: async (messageIds) => {
			const seen = await markSeen.mutateAsync({ chatId, messageIds });
			if (!active.current) return;
			useChatStore
				.getState()
				.markAllMessagesAsSeen(
					seen.map((item) => ({ ...item, seenAt: new Date(item.seenAt) })),
				);
			useChatStore.getState().resetUnreadCount(chatId);
		},
		onResync: async () => {
			const state = useChatStore.getState();
			const loaded = (state.chatMessages[chatId] ?? [])
				.map((id) => state.messagesById[id])
				.filter(
					(message): message is MessageFull =>
						!!message && !message.id.startsWith("temp-"),
				);
			const since = loaded.length
				? new Date(
						Math.min(
							...loaded.map((message) => new Date(message.createdAt).getTime()),
						),
					).toISOString()
				: new Date(0).toISOString();
			let cursor: string | undefined;
			do {
				const page = await utils.message.sync.fetch({ chatId, since, cursor });
				if (!active.current) return;
				useChatStore
					.getState()
					.mergeMessages(
						chatId,
						page.messages.map(deserializeMessage),
						senderId,
					);
				cursor = page.nextCursor ?? undefined;
			} while (cursor);
		},
	});
}
