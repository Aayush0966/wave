import { initTRPC, TRPCError } from "@trpc/server";
import { toDatabaseTRPCError } from "@wave/db";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
	errorFormatter({ shape }) {
		if (process.env.NODE_ENV === "development") {
			return shape;
		}

		return {
			...shape,
			data: {
				...shape.data,
				stack: undefined,
				cause: undefined,
			},
		};
	},
});
export const router = t.router;

const databaseErrorMiddleware = t.middleware(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		if (error instanceof TRPCError) {
			throw error;
		}

		throw (
			toDatabaseTRPCError(error) ??
			new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "An internal server error occurred.",
				cause: error,
			})
		);
	}
});

export const publicProcedure = t.procedure.use(databaseErrorMiddleware);
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
}).use(databaseErrorMiddleware);
