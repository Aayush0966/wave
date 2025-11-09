import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { appRouter } from "@wave/api/routers/_app";
import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Create a server-side TRPC client with proper context
const createServerTrpc = async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const context = { session };
	const caller = appRouter.createCaller(context);

	return caller;
};

// Export a cached version of the server TRPC client
export const trpc = cache(createServerTrpc);

// For hydration helpers, we need a caller without context for client-side hydration
const dummyContext = { session: null };
const dummyCaller = appRouter.createCaller(dummyContext);

export const { HydrateClient } = createHydrationHelpers<typeof appRouter>(
	dummyCaller,
	getQueryClient,
);
