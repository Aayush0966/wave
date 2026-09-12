import { auth } from "@wave/auth";
import {
	CreateChatRepository,
	CreateUserRepository,
	createMessageRepository,
	prisma,
} from "@wave/db";
import type { NextRequest } from "next/server";

export const repos = {
	chat: CreateChatRepository(prisma),
	user: CreateUserRepository(prisma),
	message: createMessageRepository(prisma),
};

export type Repos = typeof repos;

export async function createContext(
	req?: Request | NextRequest | { headers: Headers },
) {
	const session = req
		? await auth.api.getSession({
				headers: req.headers,
			})
		: null;
	return {
		session,
		repos,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
