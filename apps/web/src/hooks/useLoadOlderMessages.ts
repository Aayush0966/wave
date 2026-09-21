import { useChatStore } from "@wave/state";
import { useCallback, useEffect, useState } from "react";
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
	const [cursor, setCursor] = useState<string | null | undefined>(
		initialNextCursor,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(initialHasMore);

	useEffect(() => {
		setCursor(initialNextCursor);
		setHasMore(initialHasMore);
		setIsLoading(false);
	}, [chatId, initialNextCursor, initialHasMore]);

	const utils = trpc.useUtils();
	const loadMore = useCallback(
		async (containerElement: HTMLElement | null) => {
			if (!hasMore || !cursor || isLoading || !containerElement) return;

			setIsLoading(true);
			const previousScrollHeight = containerElement.scrollHeight;
			const previousScrollTop = containerElement.scrollTop;

			try {
				const result = await utils.message.getMessagesByChatId.fetch({
					chatId,
					cursor,
					limit: 20,
				});

				console.log("Older Messages: ", result);

				if (result?.messages?.length) {
					useChatStore.getState().prependMessages(chatId, result.messages);
				}
				setCursor(result?.nextCursor ?? null);
				setHasMore(result?.hasMore ?? false);

				// 4. Retain scroll position relative to newly inserted elements
				requestAnimationFrame(() => {
					const newScrollHeight = containerElement.scrollHeight;
					containerElement.scrollTop =
						newScrollHeight - previousScrollHeight + previousScrollTop;
				});
			} catch (error) {
				console.error("Error loading older messages:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[chatId, cursor, hasMore, isLoading, utils],
	);

	return {
		loadMore,
		isLoading,
		hasMore,
	};
}
