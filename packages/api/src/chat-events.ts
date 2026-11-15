import type { Context } from "./context";
import { pusherServer } from "./pusher-server";
export const chatChannel = (chatId: string) => `presence-chat-${chatId}`;
export const userChannel = (userId: string) => `private-user-${userId}`;
export async function broadcast(channel: string, event: string, data: unknown) {
	await pusherServer
		.trigger(channel, event, data)
		.catch((error: unknown) =>
			console.error(`Could not broadcast ${event}; clients will resync`, error),
		);
}

export async function notifyChatList(
	ctx: Pick<Context, "repos">,
	chatId: string,
) {
	const users = await ctx.repos.chat.getParticipantUserIds(chatId);
	await Promise.all(
		users.map((userId) =>
			broadcast(userChannel(userId), "chat-list-updated", {}),
		),
	);
}
