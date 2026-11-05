"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const LogoutButton = () => {
	const router = useRouter();

	const handleLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => router.push("/auth/signin"),
			},
		});
	};

	return (
		<button
			onClick={handleLogout}
			className="flex cursor-pointer flex-col items-center justify-center gap-1.5 text-center transition-opacity hover:opacity-70"
		>
			<LogOutIcon className="h-6 w-6 text-white" />
			<span className="text-white text-xs">Logout</span>
		</button>
	);
};

export default LogoutButton;
