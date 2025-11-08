import type { Chat, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { CreateChatParams } from "../schemas/chat.schemas";
import CreteRepository, { type Repository } from "./base.repository";

export type ChatRepository = Repository & {
	createChat: (params: CreateChatParams) => Promise<Chat | null>;
	getChatBetweenUsers: (params: CreateChatParams) => Promise<Chat | null>;
};

const CreateChatRepository = (db: PrismaClient): ChatRepository => {
	return {
		...CreteRepository(db.chat),
		getChatBetweenUsers: async ({ user1Id, user2Id }: CreateChatParams) => {
			return await db.chat.findFirst({
				where: {
					chatParticipants: {
						every: { userId: { in: [user1Id, user2Id] } },
					},
				},
			});
		},
		createChat: async ({ user1Id, user2Id }: CreateChatParams) => {
			try {
				const chat = await db.chat.create({
					data: {
						title: "",
						chatParticipants: {
							create: [{ userId: user1Id }, { userId: user2Id }],
						},
					},
					include: {
						chatParticipants: true,
					},
				});
				return chat;
			} catch (error) {
				console.log("Error while creating chat: ", error);
				throw new TRPCError({
					message: "Could not create chat",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
		},
	};
};

export default CreateChatRepository;
