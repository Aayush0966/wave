import type Pusher from "pusher-js";
import type { PresenceChannel } from "pusher-js";

const references = new WeakMap<Pusher, Map<string, number>>();
export function retainChatChannel(client: Pusher, chatId: string) {
	const name = `presence-chat-${chatId}`;
	const counts = references.get(client) ?? new Map<string, number>();
	references.set(client, counts);
	counts.set(name, (counts.get(name) ?? 0) + 1);
	const channel = client.subscribe(name) as PresenceChannel;
	let released = false;
	return {
		channel,
		release: () => {
			if (released) return;
			released = true;
			const remaining = (counts.get(name) ?? 1) - 1;
			if (remaining > 0) counts.set(name, remaining);
			else {
				counts.delete(name);
				client.unsubscribe(name);
			}
		},
	};
}
