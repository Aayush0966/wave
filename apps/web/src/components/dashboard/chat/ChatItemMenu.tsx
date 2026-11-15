"use client";
import type { Chat } from "@wave/state";
import { useChatStore } from "@wave/state";
import {
	Ban,
	Bell,
	BellOff,
	CheckCheck,
	MoreHorizontal,
	Pin,
	PinOff,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AlertDialog, DropdownMenu } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";
import type { ChatPreference } from "@/hooks/useChatPreferences";
import { trpc } from "@/lib/trpc-client";

export default function ChatItemMenu({
	chat,
	label,
	preference,
	onUpdate,
}: {
	chat: Chat;
	label: string;
	preference?: ChatPreference;
	onUpdate: (change: Partial<ChatPreference>) => void;
}) {
	const router = useRouter();
	const { chatId: activeChatId } = useParams<{ chatId?: string }>();
	const [confirmation, setConfirmation] = useState<"remove" | "block" | null>(
		null,
	);
	const utils = trpc.useUtils();
	const markRead = trpc.chat.markAsRead.useMutation({
		onSuccess: ({ count }) => {
			const store = useChatStore.getState();
			const unread =
				store.chats.find((item) => item.id === chat.id)?.unseenMessageCount ??
				0;
			store.incrementUnreadCount(chat.id, -Math.min(unread, count));
			void utils.chat.getUserChats.invalidate();
		},
		onError: () =>
			toast.error(
				"Could not mark this conversation as read. Please try again.",
			),
	});
	const remove = trpc.chat.remove.useMutation({
		onSuccess: () => {
			setConfirmation(null);
			useChatStore
				.getState()
				.setChats(
					useChatStore.getState().chats.filter((item) => item.id !== chat.id),
				);
			utils.chat.getUserChats.setData(undefined, (items) =>
				items?.filter((item) => item.id !== chat.id),
			);
			void utils.chat.getUserChats.invalidate();
			if (activeChatId === chat.id) router.replace("/dashboard/chat");
		},
		onError: () =>
			toast.error("Could not remove this conversation. Please try again."),
	});
	const block = trpc.chat.setBlocked.useMutation({
		onSuccess: (status) => {
			setConfirmation(null);
			useChatStore
				.getState()
				.setChats(
					useChatStore
						.getState()
						.chats.map((item) =>
							item.id === chat.id ? { ...item, ...status } : item,
						),
				);
			utils.chat.getUserChats.setData(undefined, (items) =>
				items?.map((item) =>
					item.id === chat.id ? { ...item, ...status } : item,
				),
			);
			void utils.chat.getUserChats.invalidate();
		},
		onError: () => toast.error("Could not update blocking. Please try again."),
	});
	const busy = remove.isPending || block.isPending;
	const item =
		"flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-xs outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-background-tertiary data-[disabled]:pointer-events-none data-[disabled]:opacity-40";
	return (
		<>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<button
						type="button"
						aria-label={`Options for ${label}`}
						title="Conversation options"
						className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-gray-400 opacity-100 outline-none hover:bg-gray-200/60 focus-visible:ring-2 focus-visible:ring-emerald-500 data-[state=open]:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 dark:hover:bg-background-tertiary"
					>
						<MoreHorizontal size={17} />
					</button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						side="bottom"
						align="end"
						sideOffset={4}
						collisionPadding={12}
						className="z-50 min-w-44 rounded-lg border border-gray-200 bg-white p-1 text-night-800 shadow-[0_4px_12px_rgb(0_0_0_/0.12)] outline-none dark:border-gray-700 dark:bg-background-secondary dark:text-text-primary"
					>
						<DropdownMenu.Item
							className={item}
							onSelect={() => onUpdate({ pinned: !preference?.pinned })}
						>
							{preference?.pinned ? <PinOff size={14} /> : <Pin size={14} />}
							{preference?.pinned ? "Unpin conversation" : "Pin conversation"}
						</DropdownMenu.Item>
						<DropdownMenu.Item
							className={item}
							onSelect={() => onUpdate({ muted: !preference?.muted })}
						>
							{preference?.muted ? <Bell size={14} /> : <BellOff size={14} />}
							{preference?.muted
								? "Unmute notifications"
								: "Mute notifications"}
						</DropdownMenu.Item>
						<DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
						<DropdownMenu.Item
							disabled={!chat.unseenMessageCount || markRead.isPending}
							className={item}
							onSelect={() => markRead.mutate({ chatId: chat.id })}
						>
							<CheckCheck size={14} />
							{markRead.isPending ? "Marking as read…" : "Mark as read"}
						</DropdownMenu.Item>
						<DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
						{chat.otherUserId && (
							<DropdownMenu.Item
								disabled={busy}
								className={`${item} text-red-600 dark:text-red-400`}
								onSelect={() =>
									chat.blockedByMe
										? block.mutate({ chatId: chat.id, blocked: false })
										: setConfirmation("block")
								}
							>
								<Ban size={14} />
								{chat.blockedByMe ? "Unblock person" : "Block person"}
							</DropdownMenu.Item>
						)}
						<DropdownMenu.Item
							disabled={busy}
							className={`${item} text-red-600 dark:text-red-400`}
							onSelect={() => setConfirmation("remove")}
						>
							<Trash2 size={14} />
							Remove conversation
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
			<AlertDialog.Root
				open={confirmation !== null}
				onOpenChange={(open) => {
					if (!open && !busy) setConfirmation(null);
				}}
			>
				<AlertDialog.Portal>
					<AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
					<AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%_-_2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-4 text-night-800 shadow-lg outline-none dark:border-gray-700 dark:bg-background-secondary dark:text-text-primary">
						<AlertDialog.Title className="font-semibold text-sm">
							{confirmation === "remove"
								? "Remove conversation?"
								: `Block ${label}?`}
						</AlertDialog.Title>
						<AlertDialog.Description className="mt-2 text-gray-500 text-xs leading-relaxed dark:text-text-secondary">
							{confirmation === "remove"
								? "Hides this chat from your list. Reopening it or receiving a new message brings it back. The other person's messages are not deleted."
								: "You won't be able to send each other messages. You can unblock this person from the conversation menu."}
						</AlertDialog.Description>
						<div className="mt-4 flex justify-end gap-2">
							<AlertDialog.Cancel asChild>
								<button
									type="button"
									disabled={busy}
									className="rounded-lg px-3 py-2 text-gray-500 text-xs outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-text-secondary dark:hover:bg-background-tertiary"
								>
									Cancel
								</button>
							</AlertDialog.Cancel>
							<AlertDialog.Action asChild>
								<button
									type="button"
									disabled={busy}
									onClick={(event) => {
										event.preventDefault();
										if (confirmation === "remove")
											remove.mutate({ chatId: chat.id });
										else block.mutate({ chatId: chat.id, blocked: true });
									}}
									className="rounded-lg bg-red-600 px-3 py-2 font-medium text-white text-xs outline-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
								>
									{busy
										? "Saving…"
										: confirmation === "remove"
											? "Remove"
											: "Block"}
								</button>
							</AlertDialog.Action>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			</AlertDialog.Root>
		</>
	);
}
