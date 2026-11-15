"use client";
import { useChatStore } from "@wave/state";
import { useEffect, useState } from "react";

export default function ChatPresence({
	chatId,
	senderId,
}: {
	chatId: string;
	senderId: string;
}) {
	const members = useChatStore((state) => state.presenceByChat[chatId]);
	const typing = useChatStore((state) => state.typingByChat[chatId]);
	const connection = useChatStore((state) => state.connectionState);
	const sync = useChatStore((state) => state.syncState[chatId]);
	const [now, setNow] = useState(0);
	useEffect(() => {
		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);
	const typers = Object.entries(typing ?? {})
		.filter(([id, item]) => id !== senderId && item.expiresAt > now)
		.map(([, item]) => item.name);
	const online = members?.some((id) => id !== senderId);
	const label =
		connection !== "connected"
			? "Reconnecting…"
			: sync === "retrying"
				? "Connection restored. Retrying sync…"
				: typers.length
					? `${typers.join(", ")} typing…`
					: online
						? "Online"
						: "Offline";
	return (
		<p
			aria-live="polite"
			className={`truncate text-xs ${online ? "text-emerald-600" : "text-gray-500"}`}
		>
			{label}
		</p>
	);
}
