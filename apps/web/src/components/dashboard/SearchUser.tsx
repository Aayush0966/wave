"use client";
import { Loader2, Search, SquarePen, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";

export default function SearchUser() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [query, setQuery] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setQuery(input.trim().toLowerCase()), 250);
		return () => clearTimeout(timer);
	}, [input]);
	const users = trpc.user.getByUsername.useQuery(
		{ username: query },
		{ enabled: open && !!query },
	);
	const router = useRouter();
	const utils = trpc.useUtils();
	const create = trpc.chat.createChat.useMutation({
		onSuccess: (chat) => {
			setOpen(false);
			setInput("");
			setQuery("");
			void utils.chat.getUserChats.invalidate();
			router.push(`/dashboard/chat/${chat.id}`);
		},
		onError: () =>
			toast.error("Could not open this conversation. Please try again."),
	});
	const waiting = input.trim().toLowerCase() !== query || users.isLoading;
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<button
					type="button"
					aria-label="New message"
					title="New message"
					className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-text-secondary dark:hover:bg-background-tertiary"
				>
					<SquarePen size={19} />
				</button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					side="bottom"
					align="end"
					sideOffset={8}
					collisionPadding={12}
					aria-label="New message"
					className="z-50 w-72 max-w-(--radix-popover-content-available-width) overflow-hidden rounded-xl border border-gray-200 bg-white text-night-800 shadow-[0_4px_16px_rgb(0_0_0_/0.12)] outline-none dark:border-gray-700 dark:bg-background-secondary dark:text-text-primary"
				>
					<div className="flex items-center gap-2 border-gray-100 border-b px-3 dark:border-gray-700">
						<Search size={16} aria-hidden="true" className="text-gray-400" />
						<input
							aria-label="Find a person by username"
							placeholder="Find a person…"
							value={input}
							maxLength={20}
							onChange={(event) => setInput(event.target.value)}
							className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
						/>
						<Popover.Close
							aria-label="Close new message"
							className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-background-tertiary"
						>
							<X size={15} />
						</Popover.Close>
					</div>
					<div className="max-h-64 overflow-y-auto">
						{!input.trim() && (
							<p className="p-3 text-gray-500 text-xs dark:text-text-secondary">
								Search by username to start a conversation.
							</p>
						)}
						{!!input.trim() && waiting && (
							<p
								role="status"
								className="flex items-center gap-2 p-3 text-gray-500 text-xs"
							>
								<Loader2 size={14} className="animate-spin" />
								Searching…
							</p>
						)}
						{!!input.trim() && !waiting && users.isError && (
							<p role="alert" className="p-3 text-red-500 text-xs">
								Could not search.{" "}
								<button
									type="button"
									onClick={() => void users.refetch()}
									className="underline"
								>
									Retry
								</button>
							</p>
						)}
						{!!query && !waiting && !users.isError && !users.data?.length && (
							<p role="status" className="p-3 text-gray-500 text-xs">
								No people found.
							</p>
						)}
						{!!input.trim() &&
							!waiting &&
							users.data?.map((user) => (
								<button
									key={user.id}
									type="button"
									disabled={create.isPending}
									onClick={() => create.mutate({ userId: user.id })}
									className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none hover:bg-gray-100 focus-visible:bg-gray-100 disabled:opacity-50 dark:focus-visible:bg-background-tertiary dark:hover:bg-background-tertiary"
								>
									{user.image ? (
										<img
											src={user.image}
											alt=""
											className="size-9 rounded-full object-cover"
										/>
									) : (
										<span className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-background-tertiary">
											<UserRound size={17} />
										</span>
									)}
									<span className="min-w-0">
										<span className="block truncate font-medium text-sm">
											{user.name}
										</span>
										<span className="block truncate text-gray-500 text-xs dark:text-text-secondary">
											@{user.username}
										</span>
									</span>
								</button>
							))}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
