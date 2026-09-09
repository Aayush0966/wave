import type { Metadata } from "next";
import "@/index.css";
import ChatBox from "@/components/dashboard/chat/ChatBox";
import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SearchUser from "@/components/dashboard/SearchUser";
import { trpc } from "@/lib/trpc-server";
import { toast } from "sonner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "wave",
  description: "wave",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const serverTrpc = await trpc();
  const chats = await serverTrpc.chat.getUserChats().catch((err) => {
    toast.error("Error: ", err)
  })
  return (
    <div className="flex h-screen w-full gap-4 overflow-hidden bg-background-primary">
      <main className="flex h-screen w-full overflow-hidden rounded-3xl bg-white dark:bg-background-secondary">
        <div className="flex h-screen w-full">
          <div className="w-full max-w-md border-gray-200 border-r dark:border-gray-500">
            <SearchUser />
            <div className="overflow-y-auto">
              {chats?.map((chat) => (
                <Link
                  href={`/dashboard/chat/${chat.id}`}
                  key={chat.id}
                  className="relative flex cursor-pointer items-center border-gray-100 border-b dark:border-gray-500"
                >
                  <ChatBox chat={chat} name={session.user.name} />
                </Link>
              ))}
            </div>
          </div>
          {/* Chat area */}
          <div className="flex flex-1">
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}
