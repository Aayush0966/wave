"use client";
import type { MessageFull } from "@wave/db";
import { useChatStore } from "@wave/state";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { deserializeMessage } from "@/lib/deserialize-message";
import { trpc } from "@/lib/trpc-client";

export default function UnsendMessage({ message }: { message: MessageFull }) {
	const mutation = trpc.message.unsend.useMutation({
		onSuccess: (removed) =>
			useChatStore.getState().applyUnsentMessage(deserializeMessage(removed)),
		onError: () => toast.error("Could not unsend message. Please try again."),
	});
	return (
		<button
			type="button"
			disabled={mutation.isPending || message.id.startsWith("temp-")}
			onClick={() => mutation.mutate({ messageId: message.id })}
			className="flex items-center gap-1 rounded-full px-2 py-1 text-gray-500 text-xs hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
			title="Remove this message for everyone"
		>
			<Undo2 size={14} />
			{mutation.isPending ? "Unsending…" : "Unsend"}
		</button>
	);
}
