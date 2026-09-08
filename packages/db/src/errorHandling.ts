import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const toDatabaseTRPCError = (error: unknown): TRPCError | undefined => {
	if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
		return undefined;
	}

	switch (error.code) {
		case "P2002":
			return new TRPCError({
				code: "CONFLICT",
				message: "Duplicate value detected for a field which expects unique values.",
				cause: error,
			});
		case "P2025":
		case "P2001":
			return new TRPCError({
				code: "NOT_FOUND",
				message: error.meta?.modelName
					? `No record found in model: ${error.meta.modelName}`
					: "The requested record was not found.",
				cause: error,
			});
		case "P2003":
			return new TRPCError({
				code: "BAD_REQUEST",
				message: `Foreign key constraint failed. Field: ${error.meta?.field_name ?? "unknown"}`,
				cause: error,
			});
		case "P2000":
			return new TRPCError({
				code: "BAD_REQUEST",
				message: `Value too long for column: ${error.meta?.column_name ?? "unknown"}`,
				cause: error,
			});
		default:
			return new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "An unexpected database error occurred.",
				cause: error,
			});
	}
};

const errorHandlingExtension = Prisma.defineExtension({
	name: "trpcErrorHandling",
	query: {
		async $allOperations({ args, query }) {
			try {
				return await query(args);
			} catch (error) {
				throw (
					toDatabaseTRPCError(error) ??
					new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "An internal database error occurred.",
						cause: error,
					})
				);
			}
		},
	},
});

export default errorHandlingExtension;
