import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import type { EmojiClickData } from 'emoji-picker-react';
import { useTheme } from '@/context/ThemeContext';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface MessageInputProps {
  onSend: (content: string) => void;
  onFileSelect: (file: File) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  uploading?: boolean;
}

export default function MessageInput({
  onSend,
  onFileSelect,
  onTypingStart,
  onTypingStop,
  disabled,
  uploading,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    if (showEmoji) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmoji]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onTypingStart();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTypingStop(), 1500);
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    onTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setValue((prev) => prev + emojiData.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    // reset so same file can be picked again
    e.target.value = '';
  };

  const isDisabled = disabled || uploading;

  return (
    <div className="relative flex items-end gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      {/* Emoji picker popup */}
      {showEmoji && (
        <div ref={pickerRef} className="absolute bottom-16 left-3 z-20 shadow-xl">
          <Suspense
            fallback={
              <div className="flex h-[380px] w-[320px] items-center justify-center rounded-lg bg-white text-sm text-gray-400 dark:bg-gray-800">
                Loading…
              </div>
            }
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} theme={(isDark ? 'dark' : 'light') as never} height={380} width={320} />
          </Suspense>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,video/mp4,video/webm,audio/*"
        onChange={handleFileChange}
        disabled={isDisabled}
      />

      {/* Emoji button */}
      <button
        type="button"
        onClick={() => setShowEmoji((prev) => !prev)}
        disabled={isDisabled}
        aria-label="Insert emoji"
        className="rounded-lg p-2.5 text-xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        🙂
      </button>

      {/* Attach file button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isDisabled}
        aria-label="Attach file or image"
        title="Attach file or image (max 20 MB)"
        className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      >
        {uploading ? (
          /* Spinner while uploading */
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          /* Paperclip icon */
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        )}
      </button>

      {/* Text input */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={uploading ? 'Uploading…' : 'Type a message…'}
        maxLength={4000}
        className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition
          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={isDisabled || !value.trim()}
        aria-label="Send message"
        className="rounded-xl bg-brand-600 p-2.5 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300 dark:disabled:bg-brand-900"
      >
        <svg className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.409l-7-14z" />
        </svg>
      </button>
    </div>
  );
}
