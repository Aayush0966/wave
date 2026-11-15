import type { MessageFull } from "@wave/db";

type SerializedMessage = Omit<
	MessageFull,
	"createdAt" | "updatedAt" | "editedAt" | "seenBy" | "deletedBy" | "replyTo"
> & {
	editedAt: string | Date | null;
	replyTo:
		| (Omit<NonNullable<MessageFull["replyTo"]>, "deletedBy"> & {
				deletedBy: (Omit<MessageFull["deletedBy"][number], "deletedAt"> & {
					deletedAt: string | Date;
				})[];
		  })
		| null;
	createdAt: string | Date;
	updatedAt: string | Date;
	seenBy: (Omit<MessageFull["seenBy"][number], "seenAt"> & {
		seenAt: string | Date;
	})[];
	deletedBy: (Omit<MessageFull["deletedBy"][number], "deletedAt"> & {
		deletedAt: string | Date;
	})[];
};

// JSON transport serializes timestamps, while the shared store uses Date objects.
export function deserializeMessage(message: SerializedMessage): MessageFull {
	return {
		...message,
		editedAt: message.editedAt ? new Date(message.editedAt) : null,
		replyTo: message.replyTo
			? {
					...message.replyTo,
					deletedBy: message.replyTo.deletedBy.map((deleted) => ({
						...deleted,
						deletedAt: new Date(deleted.deletedAt),
					})),
				}
			: null,
		createdAt: new Date(message.createdAt),
		updatedAt: new Date(message.updatedAt),
		seenBy: message.seenBy.map((seen) => ({
			...seen,
			seenAt: new Date(seen.seenAt),
		})),
		deletedBy: message.deletedBy.map((deleted) => ({
			...deleted,
			deletedAt: new Date(deleted.deletedAt),
		})),
	};
}
