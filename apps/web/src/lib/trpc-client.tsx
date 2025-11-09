"use client";

import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@wave/api";
import { useState } from "react";
import { toast } from "sonner";
import { makeQueryClient } from "./query-client";

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;

function getQueryClient() {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		const baseOptions = makeQueryClient();
		return new QueryClient({
			defaultOptions: baseOptions.getDefaultOptions(),
			queryCache: new QueryCache({
				onError: (error: any) => {
					toast.error(error.message ?? "An error occurred");
				},
			}),
		});
	}
	// Browser: use singleton pattern to keep the same query client
	if (!clientQueryClientSingleton) {
		const baseOptions = makeQueryClient();
		clientQueryClientSingleton = new QueryClient({
			defaultOptions: baseOptions.getDefaultOptions(),
			queryCache: new QueryCache({
				onError: (error: any) => {
					toast.error(error.message ?? "An error occurred", {
						action: {
							label: "Retry",
							onClick: () => {
								clientQueryClientSingleton.invalidateQueries();
							},
						},
					});
				},
			}),
		});
	}
	return clientQueryClientSingleton;
}

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";
		if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
		return "http://localhost:3000";
	})();
	return `${base}/api/trpc`;
}

export function TRPCProvider(
	props: Readonly<{
		children: React.ReactNode;
	}>,
) {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: getUrl(),
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include",
						});
					},
				}),
			],
		}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{props.children}
			</QueryClientProvider>
		</trpc.Provider>
	);
}
