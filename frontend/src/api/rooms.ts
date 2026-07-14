import client from './client';
import type { ApiResponse, ChatRoom, Credential, GeneratedCredential, ChatMessage, OnlineUser } from '@/types';

export async function createRoom(name: string) {
  const res = await client.post<ApiResponse<ChatRoom>>('/rooms', { name });
  return res.data.data as ChatRoom;
}

export async function listRooms() {
  const res = await client.get<ApiResponse<ChatRoom[]>>('/rooms');
  return res.data.data as ChatRoom[];
}

export async function getRoom(id: number) {
  const res = await client.get<ApiResponse<ChatRoom>>(`/rooms/${id}`);
  return res.data.data as ChatRoom;
}

export async function closeRoom(id: number) {
  const res = await client.patch<ApiResponse<ChatRoom>>(`/rooms/${id}/close`);
  return res.data.data as ChatRoom;
}

export async function reopenRoom(id: number) {
  const res = await client.patch<ApiResponse<ChatRoom>>(`/rooms/${id}/reopen`);
  return res.data.data as ChatRoom;
}

export async function deleteRoom(id: number) {
  await client.delete(`/rooms/${id}`);
}

export async function clearRoomMessages(id: number) {
  await client.delete(`/rooms/${id}/messages`);
}

export async function generateCredentials(roomId: number, expiresInHours?: number) {
  const res = await client.post<ApiResponse<GeneratedCredential>>(`/rooms/${roomId}/credentials`, {
    expiresInHours,
  });
  return res.data.data as GeneratedCredential;
}

export async function listCredentials(roomId: number) {
  const res = await client.get<ApiResponse<Credential[]>>(`/rooms/${roomId}/credentials`);
  return res.data.data as Credential[];
}

export async function revokeCredential(credId: number) {
  await client.patch(`/credentials/${credId}/revoke`);
}

export async function deleteCredential(credId: number) {
  await client.delete(`/credentials/${credId}`);
}

export async function getOnlineUsers(roomId: number, asAdmin: boolean) {
  const base = asAdmin ? `/rooms/${roomId}/users` : `/guest/rooms/${roomId}/users`;
  const res = await client.get<ApiResponse<OnlineUser[]>>(base);
  return res.data.data as OnlineUser[];
}

export async function removeUser(roomId: number, socketId: string) {
  await client.delete(`/rooms/${roomId}/users/${socketId}`);
}

export async function getRoomMessages(roomId: number, asAdmin: boolean) {
  const base = asAdmin ? `/rooms/${roomId}/messages` : `/guest/rooms/${roomId}/messages`;
  const res = await client.get<ApiResponse<ChatMessage[]>>(base);
  return res.data.data as ChatMessage[];
}

export async function uploadFile(roomId: number, file: File): Promise<ChatMessage> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<ApiResponse<ChatMessage>>(
    `/guest/rooms/${roomId}/upload`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
  );
  return res.data.data as ChatMessage;
}
