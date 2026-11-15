import type { MessageSeen } from "@prisma/client";
import type { MessageFull, MessageReactionUpdate } from "@wave/db";
import type Pusher from "pusher-js";
import { useEffect, useRef } from "react";
import { useChatStore } from "../chat.store";
import { retainChatChannel } from "../chat-channels";
import { createReceiptQueue, createSyncQueue } from "../chat-recovery";
import { deserializeMessage } from "../deserialize-message";

type SharedChatRoomOptions = {
	chatId: string;
	senderId: string;
	messages: MessageFull[];
	isFocused: boolean;
	pusherClient: Pusher;
	onMarkAsSeen: (messageIds: string[]) => Promise<void>;
	onResync: () => Promise<void>;
};

export function useSharedChatRoom(options: SharedChatRoomOptions) {
	const { chatId, senderId, messages, isFocused, pusherClient } = options;
	const latest = useRef(options);
	latest.current = options;
	const receipts = useRef<ReturnType<typeof createReceiptQueue> | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: A different chat or participant must get a fresh acknowledgment queue.
	useEffect(() => {
		const worker = createReceiptQueue((ids) =>
			latest.current.onMarkAsSeen(ids),
		);
		receipts.current = worker;
		return () => {
			worker.dispose();
			receipts.current = null;
		};
	}, [chatId, senderId]);
	useEffect(() => {
		const ids = messages
			.filter(
				(item) =>
					item.chatId === chatId &&
					item.senderId !== senderId &&
					!item.id.startsWith("temp-") &&
					!item.deletedBy.some(
						(deleted) => deleted.deleteType === "EVERYONE",
					) &&
					!item.seenBy.some((seen) => seen.chatParticipantId === senderId),
			)
			.map((item) => item.id);
		receipts.current?.replace(ids, isFocused);
	}, [chatId, senderId, messages, isFocused]);

	useEffect(() => {
		const { channel, release } = retainChatChannel(pusherClient, chatId);
		const recovery = createSyncQueue(
			() => latest.current.onResync(),
			(value) => {
				useChatStore.setState((state) => ({
					syncState: { ...state.syncState, [chatId]: value },
				}));
			},
		);
		const apply = recovery.apply;
		const resync = () =>
			pusherClient.connection.state === "connected"
				? recovery.resync()
				: Promise.resolve();

		const presence = () => {
			const ids: string[] = [];
			channel.members.each((member: { id: string }) => ids.push(member.id));
			useChatStore.getState().setPresence(chatId, ids);
		};
		const subscribed = () => {
			presence();
			void resync();
		};
		const onNew = (message: MessageFull) =>
			apply(() =>
				useChatStore.getState().addMessage(deserializeMessage(message)),
			);
		const onSeen = (records: MessageSeen[]) =>
			apply(() =>
				useChatStore.getState().markAllMessagesAsSeen(
					records.map((record) => ({
						...record,
						seenAt: new Date(record.seenAt),
					})),
				),
			);
		const onReact = (update: MessageReactionUpdate) =>
			apply(() => useChatStore.getState().applyMessageReaction(update));
		const onUnsent = (message: MessageFull) =>
			apply(() =>
				useChatStore.getState().applyUnsentMessage(deserializeMessage(message)),
			);
		const onEdited = (message: MessageFull) =>
			apply(() =>
				useChatStore.getState().updateMessage(deserializeMessage(message)),
			);
		const onTyping = (data: {
			participantId: string;
			typing: boolean;
			name: string;
		}) =>
			useChatStore
				.getState()
				.setTyping(chatId, data.participantId, data.name, data.typing);
		const connection = ({ current }: { current: string }) => {
			useChatStore.setState({ connectionState: current });
			if (current !== "connected")
				useChatStore.getState().setPresence(chatId, []);
		};
		channel.bind("pusher:subscription_succeeded", subscribed);
		channel.bind("pusher:member_added", presence);
		channel.bind("pusher:member_removed", presence);
		channel.bind("new-message", onNew);
		channel.bind("messages-seen", onSeen);
		channel.bind("message-reaction", onReact);
		channel.bind("message-unsent", onUnsent);
		channel.bind("message-edited", onEdited);
		channel.bind("typing", onTyping);
		pusherClient.connection.bind("state_change", connection);
		useChatStore.setState({ connectionState: pusherClient.connection.state });
		if (channel.subscribed) subscribed();
		const focus = () => {
			if (document.visibilityState === "visible") void resync();
		};
		window.addEventListener("focus", focus);
		window.addEventListener("online", focus);
		document.addEventListener("visibilitychange", focus);
		const interval = setInterval(() => {
			if (latest.current.isFocused) void resync();
		}, 15000);
		return () => {
			recovery.dispose();
			release();
			clearInterval(interval);
			window.removeEventListener("focus", focus);
			window.removeEventListener("online", focus);
			document.removeEventListener("visibilitychange", focus);
			pusherClient.connection.unbind("state_change", connection);
			channel.unbind("pusher:subscription_succeeded", subscribed);
			channel.unbind("pusher:member_added", presence);
			channel.unbind("pusher:member_removed", presence);
			channel.unbind("new-message", onNew);
			channel.unbind("messages-seen", onSeen);
			channel.unbind("message-reaction", onReact);
			channel.unbind("message-unsent", onUnsent);
			channel.unbind("message-edited", onEdited);
			channel.unbind("typing", onTyping);
		};
	}, [chatId, pusherClient]);
}
