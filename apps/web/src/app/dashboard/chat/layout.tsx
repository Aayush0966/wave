import type { Metadata } from "next";
import "@/index.css";
import { Suspense } from "react";
import SearchUser from "@/components/dashboard/SearchUser";
import ChatSidebar from "./ChatSidebar";

export const metadata: Metadata = {
	title: "wave",
	description: "wave",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex h-screen w-full gap-4 overflow-hidden bg-background-primary">
			<main className="flex h-screen w-full overflow-hidden rounded-3xl bg-white dark:bg-background-secondary">
				<div className="flex h-screen w-full">
					<div className="w-full max-w-md border-gray-200 border-r dark:border-gray-500">
						<SearchUser />
						<Suspense
							fallback={
								<div className="p-4 text-gray-400 text-sm">
									Loading chats...
								</div>
							}
						>
							<ChatSidebar />
						</Suspense>
					</div>
					{/* Chat area */}
					<div className="flex flex-1">{children}</div>
				</div>
			</main>
		</div>
	);
}
