import { router } from "../trpc";
import { chat } from "./chat";
import { user } from "./user";
import { message } from "./message";

export const appRouter = router({
	user,
	chat,
	message
});

export type AppRouter = typeof appRouter;
