import { Suspense } from "react";
import ChatShell from "@/components/dashboard/chat/ChatShell";
import SearchUser from "@/components/dashboard/SearchUser";
import ChatSidebar from "./ChatSidebar";

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense fallback={<div className="p-6">Loading chats…</div>}>
			<ChatShell
				sidebar={
					<>
						<div className="flex items-center justify-between px-5 pt-5 pb-4">
							<h1 className="font-semibold text-xl tracking-tight">Messages</h1>
							<SearchUser />
						</div>
						<Suspense
							fallback={<div className="p-4 text-sm">Loading chats…</div>}
						>
							<ChatSidebar />
						</Suspense>
					</>
				}
			>
				{children}
			</ChatShell>
		</Suspense>
	);
}
