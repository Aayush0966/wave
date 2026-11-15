"use client";
import type { Chat } from "@wave/state";
import { ArrowUpRight, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import PersonAvatar from "./PersonAvatar";

export default function PeopleList({ chats }: { chats: Chat[] }) {
	const [search, setSearch] = useState("");
	const byPerson = new Map<string, Chat>();
	for (const chat of chats) {
		if (chat.otherUserId && !byPerson.has(chat.otherUserId))
			byPerson.set(chat.otherUserId, chat);
	}
	const contacts = [...byPerson.values()];
	const term = search.trim().toLocaleLowerCase();
	const visible = contacts.filter((chat) =>
		(chat.name || "").toLocaleLowerCase().includes(term),
	);
	return (
		<>
			{contacts.length > 0 && (
				<div className="relative mb-4">
					<Search
						size={16}
						aria-hidden="true"
						className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="search"
						aria-label="Search people"
						placeholder="Search people…"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pr-3 pl-9 text-sm outline-none focus:border-emerald-500 dark:border-gray-700"
					/>
				</div>
			)}
			{visible.length ? (
				<ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
					{visible.map((chat) => (
						<li key={chat.otherUserId}>
							<Link
								href={`/dashboard/chat/${chat.id}`}
								className="flex items-center gap-3 rounded-lg px-2 py-4 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-background-tertiary"
							>
								<PersonAvatar
									name={chat.name || "Unknown"}
									image={chat.image}
								/>
								<span className="min-w-0 flex-1">
									<span className="block truncate font-medium text-sm">
										{chat.name || "Unknown"}
									</span>
									<span className="mt-0.5 block text-gray-500 text-xs dark:text-text-secondary">
										{chat.blockedByMe ? "Blocked" : "Open conversation"}
									</span>
								</span>
								<ArrowUpRight
									size={17}
									aria-hidden="true"
									className="text-gray-400"
								/>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<div
					role="status"
					className="rounded-xl border border-gray-200 px-5 py-12 text-center dark:border-gray-700"
				>
					<Users
						size={24}
						aria-hidden="true"
						className="mx-auto mb-3 text-gray-400"
					/>
					<p className="font-medium text-sm">
						{term ? "No people found" : "No conversations yet"}
					</p>
					<p className="mt-1 text-gray-500 text-xs dark:text-text-secondary">
						{term
							? "Try another name."
							: "Use New message to find someone and say hello."}
					</p>
				</div>
			)}
		</>
	);
}
