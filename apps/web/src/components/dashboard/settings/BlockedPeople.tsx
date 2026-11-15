"use client";
import { toast } from "sonner";
import PersonAvatar from "@/components/dashboard/PersonAvatar";
import { trpc } from "@/lib/trpc-client";

export default function BlockedPeople() {
	const utils = trpc.useUtils();
	const query = trpc.chat.getBlockedUsers.useQuery();
	const unblock = trpc.chat.unblockUser.useMutation({
		onSuccess: () => {
			void utils.chat.getBlockedUsers.invalidate();
			void utils.chat.getUserChats.invalidate();
		},
		onError: () =>
			toast.error("Could not unblock this person. Please try again."),
	});
	if (query.isLoading)
		return (
			<p role="status" className="mt-4 text-gray-500 text-xs">
				Loading blocked people…
			</p>
		);
	if (query.isError)
		return (
			<p role="alert" className="mt-4 text-gray-500 text-xs">
				Could not load blocked people.{" "}
				<button
					type="button"
					onClick={() => void query.refetch()}
					className="text-emerald-600 underline"
				>
					Retry
				</button>
			</p>
		);
	if (!query.data?.length)
		return (
			<p className="mt-3 text-gray-500 text-sm dark:text-text-secondary">
				You haven't blocked anyone.
			</p>
		);
	return (
		<ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700/60">
			{query.data.map((person) => (
				<li key={person.id} className="flex items-center gap-3 py-3">
					<PersonAvatar name={person.name} image={person.image} />
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-sm">{person.name}</p>
						<p className="mt-0.5 truncate text-gray-500 text-xs dark:text-text-secondary">
							@{person.username}
						</p>
					</div>
					<button
						type="button"
						disabled={unblock.isPending}
						onClick={() => unblock.mutate({ userId: person.id })}
						className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-background-tertiary"
					>
						{unblock.isPending && unblock.variables?.userId === person.id
							? "Unblocking…"
							: "Unblock"}
					</button>
				</li>
			))}
		</ul>
	);
}
