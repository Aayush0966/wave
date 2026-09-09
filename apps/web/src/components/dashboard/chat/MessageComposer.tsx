"use client";
import { ImageIcon, Mic, Paperclip, Send } from "lucide-react";
import { useChatStore } from "@wave/state";
import { useRef } from "react";
import type { Message } from "@prisma/client";

type MessageComposerProps = {
  action: (formData: FormData) => Promise<Message | undefined | null>;
  chatId: string;
  senderId: string;
};

const MessageComposer = ({ action, chatId, senderId }: MessageComposerProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const replaceMessage = useChatStore((state) => state.replaceMessage);

  const handleMessageSubmit = async (formData: FormData) => {
    const now = new Date();
    const temporaryMessageId = crypto.randomUUID();
    sendMessage({ content: String(formData.get("content") ?? "").trim(), chatId, senderId, messageType: "TEXT", id: temporaryMessageId, messageStatus: "PENDING", createdAt: now, updatedAt: now });
    const message = await action(formData);
    message && replaceMessage(message, temporaryMessageId);
    formRef.current?.reset();
  }

  return (
    <div className="flex w-full shrink-0 items-center px-3 py-3 sm:px-6">
      <form
        ref={formRef}
        action={handleMessageSubmit}
        className="flex w-full items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            title="Attach file"
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Paperclip size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Add image"
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ImageIcon size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Record voice message"
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Mic size={20} aria-hidden="true" />
          </button>
        </div>

        <input
          name="content"
          type="text"
          required
          autoComplete="off"
          className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-gray-500 dark:text-white"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          title="Send message"
          className="cursor-pointer rounded-full bg-emerald-600 p-2 text-white transition-colors hover:bg-emerald-700"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};

export default MessageComposer;
