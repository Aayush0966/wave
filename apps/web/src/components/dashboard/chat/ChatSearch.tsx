"use client";
import { useChatStore } from "@wave/state";
import { Loader2, Search, X } from "lucide-react";
import { Popover } from "radix-ui";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";

function Highlight({ text, query }: { text: string; query: string }) {
	const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
	if (index < 0 || !query) return <>{text}</>;
	const start = Math.max(0, index - 60);
	const end = Math.min(text.length, index + query.length + 120);
	return (
		<>
			{start > 0 ? "…" : ""}
			{text.slice(start, index)}
			<mark className="rounded-sm bg-emerald-100 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100">
				{text.slice(index, index + query.length)}
			</mark>
			{text.slice(index + query.length, end)}
			{end < text.length ? "…" : ""}
		</>
	);
}

export default function ChatSearch({
	chatId,
	currentParticipantId,
	participantNames,
}: {
	chatId: string;
	currentParticipantId: string;
	participantNames: Readonly<Record<string, string>>;
}) {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [query, setQuery] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setQuery(input.trim()), 250);
		return () => clearTimeout(timer);
	}, [input]);
	const results = trpc.message.search.useInfiniteQuery(
		{ chatId, query },
		{
			enabled: open && !!query,
			retry: 1,
			getNextPageParam: (page) => page.nextCursor ?? undefined,
		},
	);
	const messages = results.data?.pages.flatMap((page) => page.messages) ?? [];
	const waiting = input.trim() !== query || results.isLoading;
	const showResults = !!input.trim() && !waiting;
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<button
					type="button"
					aria-label="Search messages"
					title="Search messages"
					className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-text-secondary dark:hover:bg-background-tertiary"
				>
					<Search size={20} />
				</button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					side="bottom"
					align="end"
					sideOffset={8}
					collisionPadding={12}
					aria-label="Search this conversation"
					className="z-50 w-80 max-w-(--radix-popover-content-available-width) overflow-hidden rounded-xl border border-gray-200 bg-white text-night-800 shadow-[0_4px_16px_rgb(0_0_0_/0.12)] outline-none dark:border-gray-700 dark:bg-background-secondary dark:text-text-primary"
				>
					<div className="flex items-center gap-2 border-gray-100 border-b px-3 dark:border-gray-700">
						<Search
							size={16}
							aria-hidden="true"
							className="shrink-0 text-gray-400"
						/>
						<input
							aria-label="Search messages in this chat"
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="Search messages…"
							maxLength={200}
							className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
						/>
						{input && (
							<button
								type="button"
								aria-label="Clear message search"
								onClick={() => {
									setInput("");
									setQuery("");
								}}
								className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-background-tertiary"
							>
								<X size={14} />
							</button>
						)}
						<Popover.Close
							aria-label="Close search"
							className="rounded px-1.5 py-1 text-gray-400 text-xs hover:bg-gray-100 dark:hover:bg-background-tertiary"
						>
							Esc
						</Popover.Close>
					</div>
					<div
						className="max-h-[min(24rem,50dvh)] overflow-y-auto"
						aria-busy={!!input.trim() && waiting}
					>
						{!input.trim() && (
							<p className="px-3 py-4 text-gray-500 text-xs dark:text-text-secondary">
								Find a message in this conversation.
							</p>
						)}
						{!!input.trim() && waiting && (
							<p
								role="status"
								className="flex items-center gap-2 px-3 py-4 text-gray-500 text-xs"
							>
								<Loader2 size={14} className="animate-spin" />
								Searching…
							</p>
						)}
						{showResults && results.error && (
							<div role="alert" className="px-3 py-4 text-xs">
								Could not search.{" "}
								<button
									type="button"
									onClick={() => void results.refetch()}
									className="text-emerald-600 underline"
								>
									Retry
								</button>
							</div>
						)}
						{showResults && !results.error && !messages.length && (
							<p
								role="status"
								className="px-3 py-4 text-gray-500 text-xs dark:text-text-secondary"
							>
								No messages found.
							</p>
						)}
						{showResults &&
							messages.map((message) => (
								<button
									type="button"
									onClick={() => {
										useChatStore.getState().focusMessage(chatId, message.id);
										setOpen(false);
									}}
									key={message.id}
									className="block w-full border-gray-100 border-b px-3 py-3 text-left outline-none last:border-0 hover:bg-gray-50 focus-visible:bg-gray-100 dark:border-gray-700/60 dark:focus-visible:bg-background-tertiary dark:hover:bg-background-tertiary"
								>
									<span className="flex min-w-0 items-center justify-between gap-3">
										<span className="truncate font-medium text-gray-700 text-xs dark:text-gray-200">
											{message.senderId === currentParticipantId
												? "You"
												: participantNames[message.senderId] ||
													"Unknown sender"}
										</span>
										<time
											dateTime={new Date(message.createdAt).toISOString()}
											className="shrink-0 text-[10px] text-gray-500 dark:text-text-secondary"
										>
											{new Date(message.createdAt).toLocaleString(undefined, {
												month: "short",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit",
											})}
										</time>
									</span>
									<p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
										<Highlight text={message.content ?? ""} query={query} />
									</p>
								</button>
							))}
					</div>
					{showResults && results.hasNextPage && (
						<button
							type="button"
							disabled={results.isFetchingNextPage}
							onClick={() => void results.fetchNextPage()}
							className="w-full border-gray-100 border-t py-2.5 text-gray-500 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-background-tertiary"
						>
							{results.isFetchingNextPage ? "Loading…" : "Load more"}
						</button>
					)}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
