import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import ThemeToggle from '@/components/ThemeToggle';
import { roomLogin } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export default function RoomLoginPage() {
  const { roomCode: roomCodeParam } = useParams<{ roomCode?: string }>();
  const [roomCode, setRoomCode] = useState(roomCodeParam?.toUpperCase() || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginGuest } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roomCode.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await roomLogin(roomCode.trim().toUpperCase(), username.trim(), password);
      loginGuest({
        token: result.token,
        username: result.username,
        roomId: result.room.id,
        roomCode: result.room.roomCode,
        roomName: result.room.name,
      });
      showToast(`Welcome, ${result.username}!`, 'success');
      navigate(`/chat/${result.room.roomCode}/room`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Private Chat</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter your invite details to join a room</p>
      </div>

      <Card className="w-full max-w-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Room Code"
            placeholder="e.g. ABCD123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            maxLength={16}
          />
          <Input
            label="Username"
            placeholder="e.g. guest123"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" isLoading={loading} className="mt-2 w-full">
            Join Chat Room
          </Button>
        </form>
      </Card>

      <Link
        to="/admin/login"
        className="mt-8 text-sm text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
      >
        Admin login →
      </Link>
    </div>
  );
}
