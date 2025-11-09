import { router } from "../trpc";
import { chat } from "./chat";
import { user } from "./user";

export const appRouter = router({
	user,
	chat,
});

export type AppRouter = typeof appRouter;
