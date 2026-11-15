"use client";

import type { MessageFull } from "@wave/db";
import { MESSAGE_REACTION_EMOJIS } from "@wave/db/schemas/message.schemas";
import { useChatStore } from "@wave/state";
import { SmilePlus } from "lucide-react";
import { Popover } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";

type ReactionEmoji = (typeof MESSAGE_REACTION_EMOJIS)[number];

export default function MessageReactions({
	message,
	currentUserId,
}: {
	message: MessageFull;
	currentUserId: string;
}) {
	const [open, setOpen] = useState(false);
	const ownReaction = message.reacts.find(
		(reaction) => reaction.reactedById === currentUserId,
	);
	const mutation = trpc.message.setReaction.useMutation({
		onSuccess: (update) => {
			useChatStore.getState().applyMessageReaction(update);
		},
		onError: () => toast.error("Could not update reaction. Please try again."),
	});
	const disabled = mutation.isPending || message.id.startsWith("temp-");
	const react = (emoji: ReactionEmoji) => {
		if (disabled) return;
		setOpen(false);
		mutation.mutate({
			messageId: message.id,
			emoji: ownReaction?.emoji === emoji ? null : emoji,
		});
	};
	const counts = new Map<string, number>();
	for (const reaction of message.reacts) {
		counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
	}

	return (
		<div className="mt-1 flex flex-wrap items-center gap-1">
			{Array.from(counts, ([emoji, count]) => (
				<button
					key={emoji}
					type="button"
					disabled={disabled}
					aria-pressed={ownReaction?.emoji === emoji}
					aria-label={`${emoji}, ${count} ${count === 1 ? "reaction" : "reactions"}${ownReaction?.emoji === emoji ? ", remove your reaction" : ", react"}`}
					onClick={() => react(emoji as ReactionEmoji)}
					className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs disabled:opacity-50 ${ownReaction?.emoji === emoji ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
				>
					<span>{emoji}</span>
					<span>{count}</span>
				</button>
			))}
			<Popover.Root open={open} onOpenChange={setOpen}>
				<Popover.Trigger asChild>
					<button
						type="button"
						disabled={disabled}
						aria-label="React to message"
						className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
					>
						<SmilePlus size={16} aria-hidden="true" />
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						side="top"
						sideOffset={6}
						aria-label="Choose a reaction"
						className="z-50 flex gap-1 rounded-full border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
					>
						{MESSAGE_REACTION_EMOJIS.map((emoji) => (
							<button
								key={emoji}
								type="button"
								aria-label={`React with ${emoji}`}
								aria-pressed={ownReaction?.emoji === emoji}
								onClick={() => react(emoji)}
								className="rounded-full p-2 text-xl hover:bg-gray-100 focus-visible:outline-emerald-500 aria-pressed:bg-emerald-100 dark:aria-pressed:bg-emerald-900 dark:hover:bg-gray-800"
							>
								{emoji}
							</button>
						))}
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>
		</div>
	);
}
