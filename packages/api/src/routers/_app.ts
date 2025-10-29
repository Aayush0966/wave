import { router } from "src";
import { userRouter } from "./user/user.router";

export const appRouter = router({
	user: userRouter,
});

export type AppRouter = typeof appRouter;
