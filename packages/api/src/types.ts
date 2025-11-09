// Re-export the router types for type inference
export type { AppRouter } from "./routers/_app";

// Export inferred types from tRPC procedures
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./routers/_app";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Specific inferred types for commonly used endpoints
export type ChatListItem = NonNullable<
	RouterOutputs["chat"]["getUserChats"]
>[number];
export type CreateChatInput = RouterInputs["chat"]["createChat"];
export type GetUserChatsInput = RouterInputs["chat"]["getUserChats"];
