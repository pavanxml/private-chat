import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import MessageInput from '@/components/MessageInput';
import OnlineUsersList from '@/components/OnlineUsersList';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useChatSocket } from '@/hooks/useChatSocket';
import { getRoomMessages, uploadFile } from '@/api/rooms';
import { extractErrorMessage } from '@/api/client';

export default function ChatRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { session, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const guestSession = session?.role === 'guest' ? session : null;

  const handleRoomClosed = useCallback(
    (message: string) => {
      showToast(message, 'error');
      logout();
      navigate('/');
    },
    [showToast, logout, navigate]
  );

  const handleForceDisconnect = useCallback(
    (reason: string) => {
      showToast(reason, 'error');
      logout();
      navigate('/');
    },
    [showToast, logout, navigate]
  );

  const { messages, setMessages, onlineUsers, typingUsers, connected, socketId, sendMessage, startTyping, stopTyping } =
    useChatSocket({
      token: guestSession?.token ?? null,
      onRoomClosed: handleRoomClosed,
      onForceDisconnect: handleForceDisconnect,
    });

  useEffect(() => {
    if (!guestSession) return;
    (async () => {
      try {
        const history = await getRoomMessages(guestSession.roomId, false);
        setMessages((prev) => [...history, ...prev]);
      } catch (err) {
        showToast(extractErrorMessage(err), 'error');
      } finally {
        setHistoryLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestSession?.roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!guestSession || guestSession.roomCode !== roomCode?.toUpperCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 dark:text-gray-400">Redirecting...</p>
      </div>
    );
  }

  const handleLeave = () => {
    logout();
    navigate('/');
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!guestSession) return;
      setUploading(true);
      try {
        // The backend broadcasts message:new via socket, but also returns it
        // directly — we skip adding it here because the socket event will
        // deliver it to all clients including the sender.
        await uploadFile(guestSession.roomId, file);
      } catch (err) {
        showToast(`Upload failed: ${extractErrorMessage(err)}`, 'error');
      } finally {
        setUploading(false);
      }
    },
    [guestSession, showToast]
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-gray-900 dark:text-gray-100">{guestSession.roomName}</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            {connected ? 'Connected' : 'Connecting...'} · {guestSession.roomCode}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowUsersPanel((prev) => !prev)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Toggle online users"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"
              />
            </svg>
          </button>
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={handleLeave}>
            Leave
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!historyLoaded && <p className="text-center text-sm text-gray-400">Loading messages...</p>}
            {historyLoaded && messages.length === 0 && (
              <p className="mt-10 text-center text-sm text-gray-400">
                No messages yet. Say hello to get the conversation started!
              </p>
            )}
            {messages.map((msg) => {
              const isOwn = msg.socket_id
                ? msg.socket_id === socketId
                : msg.sender_name === guestSession.username;
              return <MessageBubble key={msg.id} message={msg} isOwn={isOwn} />;
            })}
          </div>
          <div className="px-4">
            <TypingIndicator typingUsers={typingUsers.filter((u) => u !== guestSession.username)} />
          </div>
          <MessageInput
            onSend={sendMessage}
            onFileSelect={handleFileSelect}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
            disabled={!connected}
            uploading={uploading}
          />
        </div>

        <aside className="hidden w-60 shrink-0 border-l border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:block">
          <OnlineUsersList users={onlineUsers} currentUsername={guestSession.username} />
        </aside>

        {showUsersPanel && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowUsersPanel(false)} />
            <aside className="absolute right-0 top-0 h-full w-64 bg-white p-4 shadow-xl dark:bg-gray-900">
              <OnlineUsersList users={onlineUsers} currentUsername={guestSession.username} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
