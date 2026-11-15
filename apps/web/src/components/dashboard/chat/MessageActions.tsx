"use client";
import type { MessageFull } from "@wave/db";
import { useChatStore } from "@wave/state";
import { Loader2, Pencil, Reply, Trash2 } from "lucide-react";
import { Popover } from "radix-ui";
import { useId, useState } from "react";
import { deserializeMessage } from "@/lib/deserialize-message";
import { trpc } from "@/lib/trpc-client";

export default function MessageActions({
	message,
	own,
}: {
	message: MessageFull;
	own: boolean;
}) {
	const titleId = useId();
	const descriptionId = useId();
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const utils = trpc.useUtils();
	const hide = trpc.message.hide.useMutation({
		onSuccess: ({ chatId, messageId }) => {
			setOpen(false);
			useChatStore.getState().hideMessage(chatId, messageId);
			void utils.chat.getUserChats.invalidate();
		},
		onError: () => setError("Could not delete this message. Please try again."),
	});
	const remove = trpc.message.unsend.useMutation({
		onSuccess: (removed) => {
			setOpen(false);
			useChatStore.getState().applyUnsentMessage(deserializeMessage(removed));
			void utils.chat.getUserChats.invalidate();
		},
		onError: () =>
			setError("Could not delete this message for everyone. Please try again."),
	});
	const busy = hide.isPending || remove.isPending;
	const pending = message.id.startsWith("temp-");
	const unsent = message.deletedBy.some(
		(deleted) => deleted.deleteType === "EVERYONE",
	);
	return (
		<>
			{!unsent && (
				<button
					type="button"
					disabled={pending}
					onClick={() =>
						useChatStore.getState().setReplyDraft(message.chatId, message)
					}
					className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
					aria-label="Reply to message"
				>
					<Reply size={15} />
				</button>
			)}
			{own && !unsent && (
				<button
					type="button"
					disabled={pending}
					onClick={() =>
						useChatStore.getState().setEditDraft(message.chatId, message)
					}
					className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
					aria-label="Edit message"
				>
					<Pencil size={15} />
				</button>
			)}
			<Popover.Root
				open={open}
				onOpenChange={(next) => {
					if (busy) return;
					setError(null);
					setOpen(next);
				}}
			>
				<Popover.Trigger asChild>
					<button
						type="button"
						disabled={pending || busy}
						aria-label="Delete message"
						title="Delete message"
						className="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40"
					>
						<Trash2 size={15} />
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						side="bottom"
						align={own ? "end" : "start"}
						sideOffset={4}
						collisionPadding={12}
						aria-labelledby={titleId}
						aria-describedby={descriptionId}
						onInteractOutside={(event) => {
							if (busy) event.preventDefault();
						}}
						aria-busy={busy}
						className="z-50 max-h-(--radix-popover-content-available-height) w-44 max-w-(--radix-popover-content-available-width) overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 text-night-800 shadow-[0_4px_12px_rgb(0_0_0_/0.12)] outline-none dark:border-gray-700 dark:bg-background-secondary dark:text-text-primary"
					>
						<h3 id={titleId} className="sr-only">
							Delete message?
						</h3>
						<p id={descriptionId} className="sr-only">
							Choose who to remove this message for.
						</p>
						<button
							type="button"
							disabled={busy}
							onClick={() => {
								setError(null);
								hide.mutate({ chatId: message.chatId, messageId: message.id });
							}}
							className="flex min-h-9 w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs outline-none hover:bg-gray-100 focus-visible:bg-gray-100 disabled:opacity-50 dark:focus-visible:bg-background-tertiary dark:hover:bg-background-tertiary"
						>
							{hide.isPending && <Loader2 size={12} className="animate-spin" />}
							{hide.isPending ? "Deleting…" : "Delete for me"}
						</button>
						{own && !unsent && (
							<button
								type="button"
								disabled={busy}
								onClick={() => {
									setError(null);
									remove.mutate({ messageId: message.id });
								}}
								className="flex min-h-9 w-full items-center gap-2 rounded px-2.5 py-2 text-left text-red-600 text-xs outline-none hover:bg-gray-100 focus-visible:bg-gray-100 disabled:opacity-50 dark:text-red-400 dark:focus-visible:bg-background-tertiary dark:hover:bg-background-tertiary"
							>
								{remove.isPending && (
									<Loader2 size={12} className="animate-spin" />
								)}
								{remove.isPending ? "Deleting…" : "Delete for everyone"}
							</button>
						)}
						{error && (
							<p
								role="alert"
								className="px-2.5 py-2 text-red-600 text-xs dark:text-red-400"
							>
								{error}
							</p>
						)}
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>
		</>
	);
}
