"use client";
import type { MessageFull } from "@wave/db";
import { useChatStore } from "@wave/state";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
	const contentRef = useRef<HTMLDivElement>(null);
	const followBottom = useRef(true);
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

	const focusRequest = useChatStore((state) =>
		state.messageFocus?.chatId === chatId ? state.messageFocus : null,
	);
	const handledFocus = useRef<number | null>(null);
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [finding, setFinding] = useState(false);
	const previousMessageIds = useRef(new Set<string>());
	const newestMessageId = messages.at(-1)?.id;

	useChatRoom(chatId, senderId, messages);

	const { loadMore, loadUntilMessage, hasMore, isLoading } =
		useLoadOlderMessages({
			chatId,
			initialNextCursor: cursor,
			initialHasMore,
		});

	useEffect(() => {
		if (!focusRequest) return;
		let cancelled = false;
		followBottom.current = false;
		setFinding(
			!useChatStore
				.getState()
				.chatMessages[chatId]?.includes(focusRequest.messageId),
		);
		void loadUntilMessage(focusRequest.messageId, containerRef.current).then(
			(found) => {
				if (cancelled) return;
				setFinding(false);
				if (!found)
					toast.error(
						"This message is no longer available. Try searching again.",
					);
			},
		);
		return () => {
			cancelled = true;
		};
	}, [focusRequest, loadUntilMessage, chatId]);

	useLayoutEffect(() => {
		if (
			!focusRequest ||
			handledFocus.current === focusRequest.requestId ||
			!messageIds.includes(focusRequest.messageId)
		)
			return;
		followBottom.current = false;
		const frame = requestAnimationFrame(() => {
			const element = document.getElementById(
				`message-${focusRequest.messageId}`,
			);
			if (!element) return;
			handledFocus.current = focusRequest.requestId;
			element.scrollIntoView({ behavior: "instant", block: "center" });
			setHighlightedId(focusRequest.messageId);
		});
		return () => cancelAnimationFrame(frame);
	}, [focusRequest, messageIds]);

	useEffect(() => {
		if (!highlightedId) return;
		const timer = setTimeout(() => setHighlightedId(null), 2500);
		return () => clearTimeout(timer);
	}, [highlightedId]);

	// A new final message means a send or receive; prepending history leaves it unchanged.
	useLayoutEffect(() => {
		const previous = previousMessageIds.current;
		const addedNewest = newestMessageId && !previous.has(newestMessageId);
		previousMessageIds.current = new Set(messageIds);
		if (addedNewest) {
			followBottom.current = true;
			const container = containerRef.current;
			container?.scrollTo({ top: container.scrollHeight, behavior: "instant" });
		} else if (messageIds.some((id) => !previous.has(id))) {
			// Loading history must keep the reader's position, including late media loads.
			followBottom.current = false;
		}
	}, [messageIds, newestMessageId]);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const content = contentRef.current;
		if (!container || !content) return;
		// Images, video metadata, and composer resizing can change the bottom after render.
		const observer = new ResizeObserver(() => {
			if (followBottom.current) {
				container.scrollTo({
					top: container.scrollHeight,
					behavior: "instant",
				});
			}
		});
		observer.observe(content);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;
		if (target.scrollHeight - target.scrollTop - target.clientHeight <= 4) {
			followBottom.current = true;
		}
		if (target.scrollTop <= 100 && hasMore && !isLoading) {
			loadMore(target);
		}
	};

	return (
		<div
			ref={containerRef}
			onScroll={handleScroll}
			onWheel={(event) => {
				if (event.deltaY < 0) followBottom.current = false;
			}}
			onTouchStart={() => {
				followBottom.current = false;
			}}
			onPointerDown={() => {
				followBottom.current = false;
			}}
			onKeyDownCapture={(event) => {
				if (["ArrowUp", "PageUp", "Home"].includes(event.key))
					followBottom.current = false;
			}}
			className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8"
		>
			<div ref={contentRef} className="flex min-h-full flex-col gap-3">
				{(isLoading || finding) && (
					<div className="py-2 text-center text-gray-500 text-xs dark:text-gray-400">
						{finding ? "Finding message…" : "Loading older messages…"}
					</div>
				)}
				{messages.length ? (
					messages.map((message) => (
						<div
							key={message.id}
							id={`message-${message.id}`}
							className={`rounded-2xl transition-colors ${highlightedId === message.id ? "bg-emerald-50 ring-2 ring-emerald-500/50 dark:bg-emerald-950/30" : ""}`}
						>
							<Message message={message} currentUserId={senderId} />
						</div>
					))
				) : (
					<div className="m-auto max-w-sm text-center text-gray-500 text-sm dark:text-gray-400">
						No messages yet. Start the conversation below.
						<GhostAnimation />
					</div>
				)}
			</div>
		</div>
	);
};

export default MessageList;
