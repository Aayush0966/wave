import { TRPCError } from "@trpc/server";
import type { Context } from "./context";

export async function requireChatParticipant(ctx: Context, chatId: string) {
	if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
	const participant = await ctx.repos.message.getParticipant(
		chatId,
		ctx.session.user.id,
	);
	if (!participant)
		throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
	return participant;
}

export async function requireChatCanSend(ctx: Context, chatId: string) {
	const participant = await requireChatParticipant(ctx, chatId);
	const status = await ctx.repos.chat.getBlockStatus(
		chatId,
		ctx.session?.user.id ?? "",
	);
	if (status.isBlocked)
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Messaging is blocked for this conversation",
		});
	return participant;
}
