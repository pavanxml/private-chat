import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/api/client';
import { getOnlineUsers, listCredentials, removeUser, revokeCredential, deleteCredential } from '@/api/rooms';
import type { ChatRoom, OnlineUser, Credential } from '@/types';
import { format } from 'date-fns';

interface ManageRoomModalProps {
  room: ChatRoom | null;
  onClose: () => void;
}

export default function ManageRoomModal({ room, onClose }: ManageRoomModalProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    if (!room) return;
    setLoading(true);
    try {
      const [u, c] = await Promise.all([getOnlineUsers(room.id, true), listCredentials(room.id)]);
      setUsers(u);
      setCredentials(c);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [room, showToast]);

  useEffect(() => {
    if (room) loadData();
  }, [room, loadData]);

  if (!room) return null;

  const handleRemoveUser = async (socketId: string, name: string) => {
    try {
      await removeUser(room.id, socketId);
      showToast(`${name} was removed from the room.`, 'success');
      loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleRevoke = async (credId: number) => {
    try {
      await revokeCredential(credId);
      showToast('Credential revoked.', 'success');
      loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDeleteCred = async (credId: number) => {
    try {
      await deleteCredential(credId);
      showToast('Credential deleted.', 'success');
      loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <Modal isOpen={!!room} onClose={onClose} title={`Manage · ${room.name}`}>
      <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto pr-1">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Online Users ({users.length})
          </h3>
          {loading && users.length === 0 && <p className="text-sm text-gray-400">Loading...</p>}
          {!loading && users.length === 0 && <p className="text-sm text-gray-400">No one is currently online.</p>}
          <div className="flex flex-col gap-1.5">
            {users.map((u) => (
              <div
                key={u.socket_id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
              >
                <span className="text-gray-800 dark:text-gray-100">{u.display_name}</span>
                <button
                  onClick={() => handleRemoveUser(u.socket_id, u.display_name)}
                  className="text-xs font-medium text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Credentials ({credentials.length})
          </h3>
          {!loading && credentials.length === 0 && (
            <p className="text-sm text-gray-400">No credentials generated yet.</p>
          )}
          <div className="flex flex-col gap-1.5">
            {credentials.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-gray-800 dark:text-gray-100">{c.username}</p>
                  <p className="text-xs text-gray-400">
                    {c.is_active === false ? 'Revoked' : 'Active'} · created{' '}
                    {format(new Date(c.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {c.is_active !== false && (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      Revoke
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCred(c.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
