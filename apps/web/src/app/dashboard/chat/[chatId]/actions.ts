"use server";

import { trpc } from "../../../../lib/trpc-server";

export const sendMessage = async (chatId: string, senderId: string, formData: FormData) => {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return; // good for now, but we should handle this better in the future
  const serverTrpc = await trpc();
  const message = await serverTrpc.message.createMessage({ chatId, content, messageType: "TEXT", senderId })
  return message;
}
