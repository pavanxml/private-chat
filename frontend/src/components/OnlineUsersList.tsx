interface OnlineUsersListProps {
  users: string[];
  currentUsername?: string;
}

export default function OnlineUsersList({ users, currentUsername }: OnlineUsersListProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Online — {users.length}
      </h3>
      {users.length === 0 && (
        <p className="px-2 text-sm text-gray-400 dark:text-gray-500">No one else is here yet.</p>
      )}
      {users.map((user, idx) => (
        <div
          key={`${user}-${idx}`}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate">
            {user}
            {user === currentUsername && <span className="ml-1 text-xs text-gray-400">(you)</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
