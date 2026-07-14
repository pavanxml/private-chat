import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/api/socket';
import type { ChatMessage } from '@/types';

interface UseChatSocketOptions {
  token: string | null;
  onRoomClosed?: (message: string) => void;
  onForceDisconnect?: (reason: string) => void;
}

interface UseChatSocketResult {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onlineUsers: string[];
  onlineCount: number;
  typingUsers: string[];
  connected: boolean;
  socketId: string | null;
  sendMessage: (content: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useChatSocket({ token, onRoomClosed, onForceDisconnect }: UseChatSocketOptions): UseChatSocketResult {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return undefined;

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id ?? null);
    });
    socket.on('disconnect', () => {
      setConnected(false);
      setSocketId(null);
    });

    socket.on('message:new', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('presence:update', (payload: { onlineUsers: string[]; count: number }) => {
      setOnlineUsers(payload.onlineUsers);
    });

    socket.on('typing:update', (payload: { username: string; typing: boolean }) => {
      setTypingUsers((prev) => {
        if (payload.typing) {
          return prev.includes(payload.username) ? prev : [...prev, payload.username];
        }
        return prev.filter((u) => u !== payload.username);
      });
    });

    socket.on('room:closed', (payload: { message: string }) => {
      onRoomClosed?.(payload.message);
    });

    socket.on('force_disconnect', (payload: { reason: string }) => {
      onForceDisconnect?.(payload.reason);
    });

    socket.on('error_message', (payload: { message: string }) => {
      // eslint-disable-next-line no-console
      console.error('Socket error:', payload.message);
    });

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || !content.trim()) return;
    socketRef.current.emit('message:send', { content }, (ack: { success: boolean; message?: string }) => {
      if (!ack?.success) {
        // eslint-disable-next-line no-console
        console.error('Failed to send message:', ack?.message);
      }
    });
  }, []);

  const startTyping = useCallback(() => {
    socketRef.current?.emit('typing:start');
  }, []);

  const stopTyping = useCallback(() => {
    socketRef.current?.emit('typing:stop');
  }, []);

  return {
    messages,
    setMessages,
    onlineUsers,
    onlineCount: onlineUsers.length,
    typingUsers,
    connected,
    socketId,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
