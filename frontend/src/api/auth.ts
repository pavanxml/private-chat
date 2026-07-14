import client from './client';
import type { ApiResponse, AdminInfo } from '@/types';

export interface AdminLoginResponse {
  token: string;
  admin: AdminInfo;
}

export interface RoomLoginResponse {
  token: string;
  room: { id: number; roomCode: string; name: string };
  username: string;
}

export async function adminLogin(username: string, password: string) {
  const res = await client.post<ApiResponse<AdminLoginResponse>>('/auth/admin/login', {
    username,
    password,
  });
  return res.data.data as AdminLoginResponse;
}

export async function roomLogin(roomCode: string, username: string, password: string) {
  const res = await client.post<ApiResponse<RoomLoginResponse>>('/auth/room/login', {
    roomCode,
    username,
    password,
  });
  return res.data.data as RoomLoginResponse;
}
