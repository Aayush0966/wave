"use client";

import { SearchIcon, Users, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Input } from "../ui/input";

const SearchUser = () => {
	const [query, setQuery] = useState<string>("");
	const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const {
		data: users,
		isLoading,
		isError: searchError,
	} = trpc.user.getByUsername.useQuery(
		{ username: query },
		{ enabled: query.length > 0 },
	);

	const handleClickOutside = (event: MouseEvent) => {
		if (
			dropdownRef.current &&
			!dropdownRef.current.contains(event.target as Node)
		) {
			setDropdownVisible(false);
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const createChatMutation = trpc.chat.createChat.useMutation();

	const handleUserClick = (userId: string) => {
		setDropdownVisible(false);
		createChatMutation.mutate({ userId: userId });
	};

	return (
		<div className="mx-auto max-w-md p-4">
			<div className="relative">
				<SearchIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
				<Input
					placeholder="Search users..."
					maxLength={20}
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value.toLowerCase());
						setDropdownVisible(true);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setDropdownVisible(true);
						}
					}}
					className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-10 text-gray-700 text-lg! placeholder:text-base placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-background-tertiary dark:text-gray-200 dark:focus:border-blue-400"
				/>
				{query && (
					<XIcon
						className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer text-gray-400"
						onClick={() => {
							setQuery("");
							setDropdownVisible(false);
						}}
					/>
				)}
			</div>

			{isDropdownVisible && query && (
				<div
					ref={dropdownRef}
					className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-background-tertiary"
				>
					{isLoading && (
						<div className="flex items-center justify-center p-4">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
							<span className="ml-2 text-gray-500">Searching...</span>
						</div>
					)}

					{searchError && (
						<div className="p-4 text-center text-red-500">
							<span>Error searching users</span>
						</div>
					)}

					{users && users.length > 0 ? (
						users.map((user, index) => (
							<div
								onClick={() => handleUserClick(user.id)}
								key={user.id}
								className={`flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${index !== users.length - 1 ? "border-gray-100 border-b dark:border-gray-700" : ""}`}
							>
								<div className="flex items-center space-x-3">
									<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
										{user.image ? (
											<img
												src={user.image}
												alt={user.username}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
												<Users className="h-5 w-5" />
											</div>
										)}
									</div>
									<div>
										<div className="font-medium text-gray-900 dark:text-gray-100">
											{user.name}
										</div>
										<div className="text-gray-500 text-sm dark:text-gray-400">
											@{user.username}
										</div>
									</div>
								</div>
							</div>
						))
					) : users && users.length === 0 ? (
						<div className="p-4 text-center text-gray-500">
							<Users className="mx-auto h-8 w-8 text-gray-300" />
							<span className="mt-2 block">No users found</span>
						</div>
					) : null}
				</div>
			)}
		</div>
	);
};

export default SearchUser;
