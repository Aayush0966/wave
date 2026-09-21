"use client";
import type { MessageFull } from "@wave/db";
import { useChatStore } from "@wave/state";
import { type UIEvent, useEffect, useRef } from "react";
import { useChatRoom } from "../../../hooks/useChatRoom";
import { useLoadOlderMessages } from "../../../hooks/useLoadOlderMessages";
import GhostAnimation from "../GhostAnimation";
import Message from "./Message";

type MessageListType = {
	initialMessages: MessageFull[];
	senderId: string;
	chatId: string;
	initialHasMore: boolean;
	cursor: string | null | undefined;
};
const EMPTY_IDS: string[] = [];

const MessageList = ({
	initialMessages,
	senderId,
	chatId,
	initialHasMore,
	cursor,
}: MessageListType) => {
	const bottomRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	// 1. Seed Zustand store on mount / chat switch
	useEffect(() => {
		useChatStore.getState().setInitialMessages(chatId, initialMessages);
	}, [chatId, initialMessages]);

	// 2. Read messages directly from Zustand
	const messageIds = useChatStore(
		(state) => state.chatMessages[chatId] ?? EMPTY_IDS,
	);
	const messagesById = useChatStore((state) => state.messagesById);
	const messages = messageIds
		.map((id) => messagesById[id])
		.filter((msg): msg is MessageFull => Boolean(msg));

	const previousMessageCount = useRef(messages.length);
	const hasInitialScrolled = useRef(false);

	useChatRoom(chatId, senderId, messages);

	const { loadMore, hasMore, isLoading } = useLoadOlderMessages({
		chatId,
		initialNextCursor: cursor,
		initialHasMore,
	});

	// 3. Robust scroll handler for initial load and new messages
	useEffect(() => {
		const container = containerRef.current;
		const bottom = bottomRef.current;
		if (!container || !bottom) return;

		// Force scroll to bottom the moment initial messages populate from Zustand
		if (messages.length > 0 && !hasInitialScrolled.current) {
			bottom.scrollIntoView();
			hasInitialScrolled.current = true;
			previousMessageCount.current = messages.length;
			return;
		}

		// Handle subsequent new messages (real-time chat or pagination)
		const addedMessages = messages.length > previousMessageCount.current;
		previousMessageCount.current = messages.length;

		if (addedMessages) {
			const isNearBottom =
				container.scrollHeight - container.scrollTop - container.clientHeight <
				200;
			if (isNearBottom) {
				bottom.scrollIntoView({ behavior: "smooth" });
			}
		}
	}, [messages.length]);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;
		if (target.scrollTop <= 100 && hasMore && !isLoading) {
			loadMore(target);
		}
	};

	console.log("Messages: ", messages);
	return (
		<div
			ref={containerRef}
			onScroll={handleScroll}
			className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-6 sm:px-8"
		>
			{isLoading && (
				<div className="py-2 text-center text-gray-500 text-xs dark:text-gray-400">
					Loading older messages...
				</div>
			)}
			{messages.length ? (
				messages.map((message) => (
					<Message
						key={message.id}
						message={message}
						currentUserId={senderId}
					/>
				))
			) : (
				<div className="m-auto max-w-sm text-center text-gray-500 text-sm dark:text-gray-400">
					No messages yet. Start the conversation below.
					<GhostAnimation />
				</div>
			)}
			<div ref={bottomRef} aria-hidden="true" />
		</div>
	);
};

export default MessageList;
