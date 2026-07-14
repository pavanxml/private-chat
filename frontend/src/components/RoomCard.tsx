import { format } from 'date-fns';
import type { ChatRoom } from '@/types';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface RoomCardProps {
  room: ChatRoom;
  onGenerateCredentials: (room: ChatRoom) => void;
  onClose: (room: ChatRoom) => void;
  onReopen: (room: ChatRoom) => void;
  onClearHistory: (room: ChatRoom) => void;
  onDelete: (room: ChatRoom) => void;
  onManage: (room: ChatRoom) => void;
}

export default function RoomCard({
  room,
  onGenerateCredentials,
  onClose,
  onReopen,
  onClearHistory,
  onDelete,
  onManage,
}: RoomCardProps) {
  const isOpen = room.status === 'open';

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100">{room.name}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {room.room_code}
            </code>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isOpen
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            {(room.online_count ?? 0) > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${(room.online_count ?? 0) > 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
          </span>
          {room.online_count ?? 0} online
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Created {format(new Date(room.created_at), 'MMM d, yyyy • h:mm a')} · {room.credential_count ?? 0} active
        credential{(room.credential_count ?? 0) === 1 ? '' : 's'}
      </p>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onGenerateCredentials(room)} disabled={!isOpen}>
          Generate Credentials
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onManage(room)}>
          Manage
        </Button>
        {isOpen ? (
          <Button size="sm" variant="secondary" onClick={() => onClose(room)}>
            Close Room
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => onReopen(room)}>
            Reopen
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => onClearHistory(room)}>
          Clear History
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(room)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
