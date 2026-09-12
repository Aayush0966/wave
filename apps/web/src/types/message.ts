import type { Prisma } from "@prisma/client";

export type MessageFull = Prisma.MessageGetPayload<{
	include: { seenBy: true; reacts: true; deletedBy: true };
}>;
