import type { React } from "@prisma/client";
import type { createMessageRepository } from "../repositories";

type MessageRepository = ReturnType<typeof createMessageRepository>;
export type MessageFull = Awaited<
	ReturnType<MessageRepository["getMessagesByChatId"]>
>["messages"][number];

export type MessageReactionUpdate = {
	messageId: string;
	reactedById: string;
	reaction: React | null;
};
