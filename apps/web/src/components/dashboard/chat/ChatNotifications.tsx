"use client";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const notificationsEnabled = () =>
	localStorage.getItem("wave-chat-notifications") === "on";
export default function ChatNotifications({
	className,
}: {
	className?: string;
}) {
	const [enabled, setEnabled] = useState(false);
	useEffect(() => setEnabled(notificationsEnabled()), []);
	const toggle = async () => {
		if (enabled) {
			localStorage.setItem("wave-chat-notifications", "off");
			setEnabled(false);
			return;
		}
		if (!("Notification" in window)) {
			toast.error("This browser does not support desktop notifications.");
			return;
		}
		const permission = await Notification.requestPermission();
		if (permission !== "granted") {
			toast.error(
				"Notifications are blocked. Allow them in your browser settings.",
			);
			return;
		}
		localStorage.setItem("wave-chat-notifications", "on");
		setEnabled(true);
	};
	return (
		<button
			type="button"
			onClick={toggle}
			aria-pressed={enabled}
			className={cn(
				"m-3 flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-gray-500 text-xs dark:border-gray-700",
				className,
			)}
		>
			{enabled ? <Bell size={15} /> : <BellOff size={15} />}
			{enabled ? "Notifications on" : "Enable desktop notifications"}
		</button>
	);
}
