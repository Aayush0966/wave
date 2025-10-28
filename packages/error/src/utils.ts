import { WaveError } from "./errors.js";
import { ErrorCode } from "./types.js";

export const createError = {
	unauthorized: (message = "Unauthorized access") =>
		new WaveError({ code: ErrorCode.UNAUTHORIZED, message }),

	forbidden: (message = "Access forbidden") =>
		new WaveError({ code: ErrorCode.FORBIDDEN, message }),

	notFound: (resource = "Resource", message?: string) =>
		new WaveError({
			code: ErrorCode.NOT_FOUND,
			message: message ?? `${resource} not found`,
		}),

	validation: (message = "Validation failed", metadata?: Record<string, any>) =>
		new WaveError({
			code: ErrorCode.VALIDATION_ERROR,
			message,
			metadata,
		}),

	alreadyExists: (resource = "Resource", message?: string) =>
		new WaveError({
			code: ErrorCode.ALREADY_EXISTS,
			message: message ?? `${resource} already exists`,
		}),

	internal: (message = "Internal server error") =>
		new WaveError({ code: ErrorCode.INTERNAL_ERROR, message }),

	database: (message = "Database operation failed") =>
		new WaveError({ code: ErrorCode.DATABASE_ERROR, message }),

	rateLimit: (message = "Rate limit exceeded") =>
		new WaveError({ code: ErrorCode.RATE_LIMIT_EXCEEDED, message }),
};

export const isWaveError = (error: unknown): error is WaveError => {
	return error instanceof WaveError;
};

export const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unknown error occurred";
};

export const toWaveError = (error: unknown): WaveError => {
	if (isWaveError(error)) {
		return error;
	}

	const message = getErrorMessage(error);
	return createError.internal(message);
};
