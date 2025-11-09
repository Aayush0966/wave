"use client"

import { SearchIcon, Users, XIcon } from "lucide-react"
import { Input } from "../ui/input"
import { useState, useEffect, useRef } from "react"
import { trpc } from "@/utils/trpc"
import { useMutation, useQuery } from "@tanstack/react-query"


const SearchUser = () => {
    const [query, setQuery] = useState<string>("");
    const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options = trpc.user.getByUsername.queryOptions({ username: query }, { enabled: query.length > 0 });
    const { data: users, isLoading, isError:searchError } = useQuery(options);

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setDropdownVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // const {data: chat, isError: createError} = trpc.chat.createChat.mutationOptions()


    // if (createError) {
    //     toast.error("Error while creating chat")
    // }

    const handleUserClick = (userId: string) => {
        setDropdownVisible(false);
        
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <div className="relative">
                <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search users..."
                    maxLength={20}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setDropdownVisible(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setDropdownVisible(true);
                        }
                    }}
                    className="!text-lg h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-10 text-gray-700 placeholder:text-gray-400 placeholder:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-background-tertiary dark:text-gray-200 dark:focus:border-blue-400"
                />
                {query && (
                    <XIcon
                        className="absolute top-1/2 right-3 h-5 w-5 text-gray-400 cursor-pointer -translate-y-1/2"
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
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
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
                                className={`flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${index !== users.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
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
                                            {user.username}
                                        </div>
                                        {user.email && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </div>
                                        )}
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

export default SearchUser