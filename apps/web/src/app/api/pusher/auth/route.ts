import { createContext } from "@wave/api";
import { pusherServer } from "@wave/api/pusher-server";

export async function POST(request: Request) {
	const ctx = await createContext(request);
	if (!ctx.session) return new Response(null, { status: 401 });
	const form = await request.formData();
	const socketId = form.get("socket_id");
	const channel = form.get("channel_name");
	if (
		typeof socketId !== "string" ||
		!/^\d+\.\d+$/.test(socketId) ||
		typeof channel !== "string"
	)
		return new Response(null, { status: 400 });
	if (channel === `private-user-${ctx.session.user.id}`)
		return Response.json(pusherServer.authorizeChannel(socketId, channel));
	if (!channel.startsWith("presence-chat-"))
		return new Response(null, { status: 403 });
	const participant = await ctx.repos.message.getParticipant(
		channel.slice("presence-chat-".length),
		ctx.session.user.id,
	);
	if (!participant) return new Response(null, { status: 403 });
	return Response.json(
		pusherServer.authorizeChannel(socketId, channel, {
			user_id: participant.id,
			user_info: { name: ctx.session.user.name },
		}),
	);
}
