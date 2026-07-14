interface TypingIndicatorProps {
  typingUsers: string[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return <div className="h-6" />;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
        : `${typingUsers.length} people are typing`;

  return (
    <div className="flex h-6 items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-gray-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-gray-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-gray-400" />
      </span>
      {label}
    </div>
  );
}
