"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type ChatPreference = { pinned: boolean; muted: boolean };
export type ChatPreferences = Record<string, ChatPreference>;
export const chatPreferenceKey = (userId: string) =>
	`wave-chat-preferences:${userId}`;
export function parseChatPreferences(raw: string | null): ChatPreferences {
	try {
		const parsed: unknown = JSON.parse(raw ?? "{}");
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
			return {};
		return Object.fromEntries(
			Object.entries(parsed)
				.filter(([, value]) => value && typeof value === "object")
				.map(([id, value]) => [
					id,
					{ pinned: value.pinned === true, muted: value.muted === true },
				]),
		);
	} catch {
		return {};
	}
}

export function useChatPreferences(userId: string) {
	const [stored, setStored] = useState<{
		userId: string;
		preferences: ChatPreferences;
	}>({ userId, preferences: {} });
	const current = useRef<ChatPreferences>({});
	useEffect(() => {
		const key = chatPreferenceKey(userId);
		const read = () => {
			let preferences: ChatPreferences = {};
			try {
				preferences = parseChatPreferences(window.localStorage.getItem(key));
			} catch {}
			current.current = preferences;
			setStored({ userId, preferences });
		};
		read();
		const onStorage = (event: StorageEvent) => {
			if (event.key === key || event.key === null) read();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [userId]);
	const update = useCallback(
		(chatId: string, change: Partial<ChatPreference>) => {
			const preferences = {
				...current.current,
				[chatId]: {
					pinned: false,
					muted: false,
					...current.current[chatId],
					...change,
				},
			};
			current.current = preferences;
			setStored({ userId, preferences });
			try {
				window.localStorage.setItem(
					chatPreferenceKey(userId),
					JSON.stringify(preferences),
				);
			} catch {
				toast.error(
					"This setting will reset when you reload; browser storage is unavailable.",
				);
			}
		},
		[userId],
	);
	return {
		preferences: stored.userId === userId ? stored.preferences : {},
		update,
	};
}
