import { useChatStore } from "@wave/state";
import { useCallback, useEffect, useRef, useState } from "react";
import { deserializeMessage } from "@/lib/deserialize-message";
import { trpc } from "@/lib/trpc-client";

export function useLoadOlderMessages({
	chatId,
	initialNextCursor,
	initialHasMore,
}: {
	chatId: string;
	initialNextCursor: string | null | undefined;
	initialHasMore: boolean;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const cursor = useRef(initialNextCursor);
	const more = useRef(initialHasMore);
	const active = useRef(true);
	const inFlight = useRef<Promise<boolean> | null>(null);
	const scrollVersion = useRef(0);
	const jumpVersion = useRef(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Chat changes reset pagination even if the cursor is identical.
	useEffect(() => {
		active.current = true;
		cursor.current = initialNextCursor;
		more.current = initialHasMore;
		setHasMore(initialHasMore);
		return () => {
			active.current = false;
			jumpVersion.current++;
			scrollVersion.current++;
		};
	}, [chatId, initialNextCursor, initialHasMore]);
	const utils = trpc.useUtils();
	const loadMore = useCallback(
		(
			container: HTMLElement | null,
			preservePosition = true,
		): Promise<boolean> => {
			if (inFlight.current) return inFlight.current;
			if (!active.current || !more.current || !cursor.current || !container)
				return Promise.resolve(false);
			const previousHeight = container.scrollHeight;
			const previousTop = container.scrollTop;
			const version = scrollVersion.current;
			const previousNewest = useChatStore
				.getState()
				.chatMessages[chatId]?.at(-1);
			setIsLoading(true);
			const run = async () => {
				try {
					const page = await utils.message.getMessagesByChatId.fetch({
						chatId,
						cursor: cursor.current ?? undefined,
						limit: 100,
					});
					if (!active.current) return false;
					useChatStore
						.getState()
						.prependMessages(chatId, page.messages.map(deserializeMessage));
					cursor.current = page.nextCursor;
					more.current = page.hasMore;
					setHasMore(page.hasMore);
					if (preservePosition)
						requestAnimationFrame(() => {
							if (!active.current || version !== scrollVersion.current) return;
							const newest = useChatStore
								.getState()
								.chatMessages[chatId]?.at(-1);
							if (newest !== previousNewest)
								container.scrollTo({
									top: container.scrollHeight,
									behavior: "instant",
								});
							else
								container.scrollTop =
									container.scrollHeight - previousHeight + previousTop;
						});
					return page.messages.length > 0;
				} catch (error) {
					console.error("Error loading older messages:", error);
					return false;
				} finally {
					inFlight.current = null;
					if (active.current) setIsLoading(false);
				}
			};
			inFlight.current = run();
			return inFlight.current;
		},
		[chatId, utils],
	);
	const loadUntilMessage = useCallback(
		async (messageId: string, container: HTMLElement | null) => {
			const version = ++jumpVersion.current;
			scrollVersion.current++;
			while (active.current && version === jumpVersion.current) {
				if (useChatStore.getState().chatMessages[chatId]?.includes(messageId))
					return true;
				if (!(await loadMore(container, false))) return false;
			}
			return false;
		},
		[chatId, loadMore],
	);
	return { loadMore, loadUntilMessage, isLoading, hasMore };
}
