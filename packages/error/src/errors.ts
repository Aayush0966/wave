import { ErrorCode, type ErrorDetails } from "./types.js";

export class WaveError extends Error {
	public readonly code: ErrorCode;
	public readonly statusCode: number;
	public readonly metadata?: Record<string, any>;

	constructor(details: ErrorDetails) {
		super(details.message);
		this.name = "WaveError";
		this.code = details.code;
		this.statusCode =
			details.statusCode ?? this.getDefaultStatusCode(details.code);
		this.metadata = details.metadata;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, WaveError);
		}
	}

	private getDefaultStatusCode(code: ErrorCode): number {
		switch (code) {
			case ErrorCode.UNAUTHORIZED:
			case ErrorCode.INVALID_CREDENTIALS:
				return 401;
			case ErrorCode.FORBIDDEN:
				return 403;
			case ErrorCode.NOT_FOUND:
				return 404;
			case ErrorCode.ALREADY_EXISTS:
				return 409;
			case ErrorCode.VALIDATION_ERROR:
			case ErrorCode.INVALID_INPUT:
				return 400;
			case ErrorCode.RATE_LIMIT_EXCEEDED:
				return 429;
			case ErrorCode.DATABASE_ERROR:
			case ErrorCode.EXTERNAL_SERVICE_ERROR:
			case ErrorCode.INTERNAL_ERROR:
			default:
				return 500;
		}
	}

	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
			metadata: this.metadata,
		};
	}
}
