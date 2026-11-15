"use server";

import { trpc } from "../../../../lib/trpc-server";

export const sendMessage = async (
	chatId: string,
	senderId: string,
	formData: FormData,
) => {
	const content = String(formData.get("content") ?? "").trim();
	if (!content) return;
	const serverTrpc = await trpc();
	const message = await serverTrpc.message.createMessage({
		clientMessageId: String(formData.get("clientMessageId") || ""),
		replyToId: String(formData.get("replyToId") || "") || undefined,
		chatId,
		content,
		messageType: "TEXT",
		senderId,
	});
	return message;
};
