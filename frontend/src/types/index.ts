export type Role = 'admin' | 'guest';

export interface AdminInfo {
  id: number;
  username: string;
}

export interface ChatRoom {
  id: number;
  room_code: string;
  name: string;
  status: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  online_count?: number;
  credential_count?: number;
}

export interface Credential {
  id: number;
  username: string;
  expires_at: string | null;
  is_active?: boolean;
  created_at: string;
}

export interface GeneratedCredential extends Credential {
  password: string;
  roomCode: string;
  joinUrl: string;
}

export interface ChatMessage {
  id: number;
  sender_name: string;
  socket_id?: string | null;
  content: string;
  message_type: 'text' | 'system' | 'image' | 'file';
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  created_at: string;
}

export interface OnlineUser {
  id: number;
  display_name: string;
  socket_id: string;
  joined_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
}
