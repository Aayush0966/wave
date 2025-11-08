import { router } from "src";
import { chat, user } from "./routes";

export const appRouter = router({
	user,
	chat,
});

export type AppRouter = typeof appRouter;
