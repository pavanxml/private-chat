import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import ThemeToggle from '@/components/ThemeToggle';
import RoomCard from '@/components/RoomCard';
import CredentialResultModal from '@/components/CredentialResultModal';
import ManageRoomModal from '@/components/ManageRoomModal';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';
import {
  listRooms,
  createRoom,
  closeRoom,
  reopenRoom,
  deleteRoom,
  clearRoomMessages,
  generateCredentials,
} from '@/api/rooms';
import type { ChatRoom, GeneratedCredential } from '@/types';

export default function AdminDashboardPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  const [expiryHours, setExpiryHours] = useState<string>('24');
  const [credentialTargetRoom, setCredentialTargetRoom] = useState<ChatRoom | null>(null);
  const [generatingCred, setGeneratingCred] = useState(false);
  const [generatedCredential, setGeneratedCredential] = useState<GeneratedCredential | null>(null);

  const [manageRoom, setManageRoom] = useState<ChatRoom | null>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<ChatRoom | null>(null);

  const { showToast } = useToast();
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const loadRooms = useCallback(async () => {
    try {
      const data = await listRooms();
      setRooms(data);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 8000); // light polling for presence/counts
    return () => clearInterval(interval);
  }, [loadRooms]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      await createRoom(newRoomName.trim());
      showToast('Chat room created.', 'success');
      setNewRoomName('');
      setShowCreateModal(false);
      loadRooms();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setCreating(false);
    }
  };

  const openCredentialModal = (room: ChatRoom) => {
    setCredentialTargetRoom(room);
    setExpiryHours('24');
  };

  const handleGenerateCredentials = async (e: FormEvent) => {
    e.preventDefault();
    if (!credentialTargetRoom) return;
    setGeneratingCred(true);
    try {
      const hours = expiryHours.trim() ? parseFloat(expiryHours) : undefined;
      const cred = await generateCredentials(credentialTargetRoom.id, hours);
      setGeneratedCredential(cred);
      setCredentialTargetRoom(null);
      loadRooms();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setGeneratingCred(false);
    }
  };

  const handleClose = async (room: ChatRoom) => {
    try {
      await closeRoom(room.id);
      showToast(`"${room.name}" closed.`, 'success');
      loadRooms();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleReopen = async (room: ChatRoom) => {
    try {
      await reopenRoom(room.id);
      showToast(`"${room.name}" reopened.`, 'success');
      loadRooms();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleClearHistory = async (room: ChatRoom) => {
    try {
      await clearRoomMessages(room.id);
      showToast(`History cleared for "${room.name}".`, 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteRoom) return;
    try {
      await deleteRoom(confirmDeleteRoom.id);
      showToast(`"${confirmDeleteRoom.name}" deleted.`, 'success');
      setConfirmDeleteRoom(null);
      loadRooms();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Private Chat — Admin</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as {session?.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chat Rooms</h2>
          <Button onClick={() => setShowCreateModal(true)}>+ Create Room</Button>
        </div>

        {loading && <p className="text-sm text-gray-400">Loading rooms...</p>}

        {!loading && rooms.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">No chat rooms yet. Create your first one to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onGenerateCredentials={openCredentialModal}
              onClose={handleClose}
              onReopen={handleReopen}
              onClearHistory={handleClearHistory}
              onDelete={setConfirmDeleteRoom}
              onManage={setManageRoom}
            />
          ))}
        </div>
      </main>

      {/* Create Room Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Chat Room">
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
          <Input
            label="Room Name"
            placeholder="e.g. Project Falcon Discussion"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            autoFocus
          />
          <Button type="submit" isLoading={creating} className="w-full">
            Create Room
          </Button>
        </form>
      </Modal>

      {/* Generate Credentials Modal */}
      <Modal
        isOpen={!!credentialTargetRoom}
        onClose={() => setCredentialTargetRoom(null)}
        title={`Generate Credentials · ${credentialTargetRoom?.name ?? ''}`}
      >
        <form onSubmit={handleGenerateCredentials} className="flex flex-col gap-4">
          <Input
            label="Expires In (hours)"
            type="number"
            min={0.1}
            step={0.5}
            placeholder="Leave blank for no expiry"
            value={expiryHours}
            onChange={(e) => setExpiryHours(e.target.value)}
          />
          <p className="text-xs text-gray-400">
            A random username and password will be generated. Multiple guests can use the same credentials at once.
          </p>
          <Button type="submit" isLoading={generatingCred} className="w-full">
            Generate
          </Button>
        </form>
      </Modal>

      <CredentialResultModal credential={generatedCredential} onClose={() => setGeneratedCredential(null)} />

      <ManageRoomModal room={manageRoom} onClose={() => setManageRoom(null)} />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!confirmDeleteRoom}
        onClose={() => setConfirmDeleteRoom(null)}
        title="Delete Chat Room?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteRoom(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will permanently delete <strong>{confirmDeleteRoom?.name}</strong>, all its credentials, and its
          entire chat history. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
