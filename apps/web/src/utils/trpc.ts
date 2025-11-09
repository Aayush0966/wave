// utils/trpc.ts
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@wave/api";  // type import only
import { toast } from "sonner";

// Create globally shared React Query client
export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error: any) => {
			toast.error(error.message ?? "An error occurred", {
				action: {
					label: "Retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "/api/trpc",  // ensure this is correct for your environment
			fetch(url: string | RequestInfo, options?: RequestInit) {
				return fetch(url, {
					...options,
					credentials: "include", // include cookies/session
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
