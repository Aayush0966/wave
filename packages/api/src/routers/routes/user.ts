import { CreateUserRepository, prisma } from "@wave/db";
import { protectedProcedure, router } from "src";
import CreateUserService from "src/services/user";
import { z } from "zod";

const userRepository = CreateUserRepository(prisma);
const userService = CreateUserService(userRepository);

export const user = router({
	getProfile: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			return await userService.getProfile(input.id);
		}),

	getByUsername: protectedProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input }) => {
			return await userService.getByUsername(input.username);
		}),
});
