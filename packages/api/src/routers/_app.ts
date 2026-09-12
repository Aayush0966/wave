import { router } from "../trpc";
import { chat } from "./chat";
import { message } from "./message";
import { user } from "./user";

export const appRouter = router({
	user,
	chat,
	message,
});

export type AppRouter = typeof appRouter;
