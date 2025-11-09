import { CreateChatRepository, createChatSchema, prisma } from "@wave/db";
import { protectedProcedure, router } from "../trpc";
import { CreateChatService } from "../services/chat";

const chatRepo = CreateChatRepository(prisma);
const chatService = CreateChatService(chatRepo);



export const chat = router({
	createChat: protectedProcedure
		.input(createChatSchema)
		.mutation(async ({ input, ctx }) => {
			const sessionUserId = ctx.session.user.id; 
			const targetUserId = input.userId; 

			return await chatService.createChat({
				user1Id: sessionUserId,
				user2Id: targetUserId
			});
		}),

	getUserChats: protectedProcedure
		.query(async ({ ctx }) => {
			const userId = ctx.session.user.id
			return await chatService.getUserChats(userId)
		})
});
