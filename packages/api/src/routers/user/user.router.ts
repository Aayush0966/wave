import { protectedProcedure, router } from "src";
import UserService from "src/services/user.services";
import { z } from "zod";

const userService = new UserService();

export const userRouter = router({
	getProfile: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			return await userService.getProfile(input.id);
		}),
});
