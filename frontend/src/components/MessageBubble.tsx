import { format } from 'date-fns';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon() {
  return (
    <svg className="h-8 w-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  // ── System messages (join / leave) ──────────────────────────────────────────
  if (message.message_type === 'system') {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {message.content}
        </span>
      </div>
    );
  }

  // ── Bubble colours ───────────────────────────────────────────────────────────
  // Own  → blue  (#1f3ce6 brand)
  // Other → green (#16a34a / emerald-600)
  const bubbleClass = isOwn
    ? 'bg-brand-600 text-white rounded-br-sm'
    : 'bg-emerald-500 text-white rounded-bl-sm';

  // ── Image message ────────────────────────────────────────────────────────────
  if (message.message_type === 'image' && message.file_url) {
    return (
      <div className={`flex flex-col animate-fade-in ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="mb-1 ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {message.sender_name}
          </span>
        )}
        <div className={`max-w-[75%] sm:max-w-[55%] overflow-hidden rounded-2xl shadow-sm ${bubbleClass} p-1`}>
          <a href={message.file_url} target="_blank" rel="noopener noreferrer">
            <img
              src={message.file_url}
              alt={message.file_name ?? 'Image'}
              className="rounded-xl object-cover w-full max-h-72 cursor-zoom-in hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </a>
          {message.file_name && (
            <p className="px-2 pb-1 pt-0.5 text-[11px] opacity-80 truncate">{message.file_name}</p>
          )}
        </div>
        <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
          {format(new Date(message.created_at), 'h:mm a')}
        </span>
      </div>
    );
  }

  // ── File (non-image) message ─────────────────────────────────────────────────
  if (message.message_type === 'file' && message.file_url) {
    return (
      <div className={`flex flex-col animate-fade-in ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="mb-1 ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {message.sender_name}
          </span>
        )}
        <a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={message.file_name ?? true}
          className={`flex items-center gap-3 max-w-[75%] sm:max-w-[55%] rounded-2xl px-4 py-3 shadow-sm
            hover:opacity-90 transition-opacity ${bubbleClass}`}
        >
          <FileIcon />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-snug">
              {message.file_name ?? 'Download file'}
            </p>
            {message.file_size != null && (
              <p className="text-[11px] opacity-75 mt-0.5">{formatBytes(message.file_size)}</p>
            )}
          </div>
          {/* Download arrow */}
          <svg className="h-4 w-4 shrink-0 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
        <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
          {format(new Date(message.created_at), 'h:mm a')}
        </span>
      </div>
    );
  }

  // ── Plain text message ───────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col animate-fade-in ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && (
        <span className="mb-1 ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          {message.sender_name}
        </span>
      )}
      <div className={`max-w-[75%] break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[65%] ${bubbleClass}`}>
        {message.content}
      </div>
      <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
        {format(new Date(message.created_at), 'h:mm a')}
      </span>
    </div>
  );
}
