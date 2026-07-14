import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import type { GeneratedCredential } from '@/types';

interface CredentialResultModalProps {
  credential: GeneratedCredential | null;
  onClose: () => void;
}

export default function CredentialResultModal({ credential, onClose }: CredentialResultModalProps) {
  const { showToast } = useToast();

  if (!credential) return null;

  const fullUrl = `${window.location.origin}${credential.joinUrl}`;
  const shareText = `Join the chat:\nURL: ${fullUrl}\nUsername: ${credential.username}\nPassword: ${credential.password}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard.`, 'success');
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  return (
    <Modal isOpen={!!credential} onClose={onClose} title="Credentials Generated">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Share these details with the guest. The password is shown only once — copy it now.
        </p>

        <FieldRow label="URL" value={fullUrl} onCopy={() => copyToClipboard(fullUrl, 'URL')} />
        <FieldRow label="Username" value={credential.username} onCopy={() => copyToClipboard(credential.username, 'Username')} />
        <FieldRow label="Password" value={credential.password} onCopy={() => copyToClipboard(credential.password, 'Password')} />

        <Button variant="secondary" className="mt-2 w-full" onClick={() => copyToClipboard(shareText, 'All details')}>
          Copy All Details
        </Button>
      </div>
    </Modal>
  );
}

function FieldRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
          {value}
        </code>
        <button
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
