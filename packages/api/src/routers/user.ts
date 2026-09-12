import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const user = router({
	getProfile: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const user = await ctx.repos.user.getById(input.id);
			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}
			return user;
		}),

	getByUsername: protectedProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input, ctx }) => {
			const users = await ctx.repos.user.getByUsername(input.username);
			if (!users) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}
			return users;
		}),
});
