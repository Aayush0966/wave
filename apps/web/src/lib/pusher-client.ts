import PusherClient from "pusher-js";

const appKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!appKey || !cluster) {
	throw new Error(
		"Pusher key and cluster are required to initialize realtime chat",
	);
}

export const pusherClient = new PusherClient(appKey, {
	cluster,
	channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
});
