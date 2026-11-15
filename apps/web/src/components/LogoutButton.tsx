"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@wave/state";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { pusherClient } from "@/lib/pusher-client";

export default function LogoutButton({
	variant = "rail",
}: {
	variant?: "rail" | "row";
}) {
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);
	const handleLogout = async () => {
		if (pending) return;
		setPending(true);
		try {
			const result = await authClient.signOut();
			if (result.error) {
				toast.error("Could not sign out. Please try again.");
				return;
			}
			pusherClient.disconnect();
			queryClient.clear();
			useChatStore.setState(useChatStore.getInitialState(), true);
			window.location.assign("/auth/signin");
		} catch {
			toast.error("Could not sign out. Please try again.");
		} finally {
			setPending(false);
		}
	};
	return (
		<button
			type="button"
			disabled={pending}
			onClick={handleLogout}
			className={`flex cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 ${variant === "rail" ? "flex-col gap-1.5 px-3 py-2 text-silver hover:bg-white/5 hover:text-white" : "gap-2 px-3 py-2 text-red-600 text-sm hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"}`}
		>
			<LogOut size={variant === "rail" ? 21 : 16} />
			<span className={variant === "rail" ? "text-[10px]" : ""}>
				{pending ? "Signing out…" : "Sign out"}
			</span>
		</button>
	);
}
