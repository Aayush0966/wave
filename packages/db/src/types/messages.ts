import { createMessageRepository } from "../repositories";

type MessageRepository = ReturnType<typeof createMessageRepository>;
export type MessageFull = Awaited<ReturnType<MessageRepository["getMessagesByChatId"]>>[number];
