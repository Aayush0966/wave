import { ArrowUpRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import PageContent from "@/components/dashboard/PageContent";
import PersonAvatar from "@/components/dashboard/PersonAvatar";
import { trpc } from "@/lib/trpc-server";

export default async function ActivityPage() {
	const server = await trpc();
	const [activity, chats] = await Promise.all([
		server.chat.getActivity(),
		server.chat.getUserChats(),
	]);
	return (
		<PageContent
			title="Activity"
			description="Your messaging over the last 7 days."
		>
			<dl className="grid grid-cols-2 gap-3">
				<div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
					<dt className="text-gray-500 text-xs dark:text-text-secondary">
						Messages sent
					</dt>
					<dd className="mt-2 font-semibold text-3xl tabular-nums">
						{activity.sent.toLocaleString()}
					</dd>
				</div>
				<div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
					<dt className="text-gray-500 text-xs dark:text-text-secondary">
						Messages received
					</dt>
					<dd className="mt-2 font-semibold text-3xl tabular-nums">
						{activity.received.toLocaleString()}
					</dd>
				</div>
			</dl>
			<section className="mt-8">
				<h2 className="mb-3 font-medium text-sm">Recent conversations</h2>
				{chats.length ? (
					<ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
						{chats.slice(0, 5).map((chat) => (
							<li key={chat.id}>
								<Link
									href={`/dashboard/chat/${chat.id}`}
									className="flex items-center gap-3 rounded-lg px-2 py-3 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-background-tertiary"
								>
									<PersonAvatar name={chat.name || "You"} image={chat.image} />
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-sm">
											{chat.title || chat.name || "You"}
										</span>
										<span className="mt-1 block truncate text-gray-500 text-xs dark:text-text-secondary">
											{chat.lastMessage || "No messages yet"}
										</span>
									</span>
									<ArrowUpRight size={16} className="text-gray-400" />
								</Link>
							</li>
						))}
					</ul>
				) : (
					<div className="rounded-xl border border-gray-200 px-5 py-10 text-center dark:border-gray-700">
						<MessageCircle size={24} className="mx-auto mb-3 text-gray-400" />
						<p className="text-gray-500 text-sm dark:text-text-secondary">
							Your conversations will appear here.
						</p>
						<Link
							href="/dashboard/chat"
							className="mt-3 inline-block text-emerald-600 text-sm hover:underline dark:text-emerald-400"
						>
							Open messages
						</Link>
					</div>
				)}
			</section>
		</PageContent>
	);
}
