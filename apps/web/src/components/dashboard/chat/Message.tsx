import { Check, CheckCheck, Clock3 } from "lucide-react";
import type { Message as PrismaMessage } from "@prisma/client";

type MessageProps = {
  message: PrismaMessage;
  currentUserId: string;
};

const Message = ({ message, currentUserId }: MessageProps) => {
  const isOwnMessage = message.senderId === currentUserId;
  const status = {
    PENDING: { label: "Pending", icon: Clock3, className: "text-emerald-100" },
    SENT: { label: "Sent", icon: Check, className: "text-emerald-100" },
    DELIVERED: { label: "Delivered", icon: CheckCheck, className: "text-emerald-100" },
    READ: { label: "Seen", icon: CheckCheck, className: "text-sky-200" },
  }[message.messageStatus];
  const StatusIcon = status.icon;

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(80%,32rem)] rounded-2xl px-4 py-3 shadow-sm ${isOwnMessage
          ? "rounded-br-md bg-emerald-600 text-white"
          : "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
          }`}
      >
        <p className="wrap-break-word text-sm leading-relaxed">
          {message.content || "Attachment"}
        </p>
        <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isOwnMessage ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"}`}>
          <time dateTime={message.createdAt.toISOString()}>
            {message.createdAt.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
          {isOwnMessage && (
            <span title={status.label} aria-label={status.label}>
              <StatusIcon className={status.className} size={14} strokeWidth={2.5} aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
