import {animations} from "@wave/ui";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <div className="mx-auto mb-4 flex flex-wrap items-center justify-center gap-2">
          <animations.ghostAnimation />

          <p className="text-lg">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    </div>
  );
}
