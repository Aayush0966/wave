import type { Metadata } from "next";
import "@/index.css";
import Sidebar from "@/components/sidebar";
import ChatList from "@/components/dashboard/ChatBox";
import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SearchUser from "@/components/dashboard/SearchUser";
import { trpc } from "@/lib/trpc-server";
import { toast } from "sonner";

export const metadata: Metadata = {
	title: "wave",
	description: "wave",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/signin");
	}

	const serverTrpc = await trpc();
	const chats = await serverTrpc.chat.getUserChats().catch((err) => {
		toast.error("Error: ", err)
	})
	return (
		<div className="flex h-screen w-full gap-4 overflow-hidden bg-background-primary">
			<div className="hidden h-screen w-28 shrink-0 lg:block">
				<Sidebar />
			</div>
			<main className="flex h-screen w-full overflow-hidden rounded-3xl bg-white dark:bg-background-secondary">
				{children}
			</main>
		</div>
	);
}
