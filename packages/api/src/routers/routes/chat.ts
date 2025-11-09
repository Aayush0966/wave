import { CreateChatRepository, createChatSchema, prisma } from "@wave/db";
import { protectedProcedure, router } from "src";
import { CreateChatService } from "src/services/chat";

const chatRepo = CreateChatRepository(prisma);
const chatService = CreateChatService(chatRepo);

export const chat = router({
	createChat: protectedProcedure
		.input(createChatSchema)
		.mutation(async ({ input }) => {
			return await chatService.createChat(input);
		}),
});
