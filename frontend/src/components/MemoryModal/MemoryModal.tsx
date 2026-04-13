import { useState } from 'preact/hooks';
import { X, Users, Lock, Link2, Copy, Heart, Eye } from 'lucide-preact';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';
import { MOOD_EMOJI } from './MemoryModal.types';
import type { MemoryModalProps } from './MemoryModal.types';

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

export function MemoryModal({ entry, onClose, onDelete, onPreviewGuest }: MemoryModalProps) {
  const [isOpen, setIsOpen] = useState(entry.isOpen);
  const shareUrl = entry.shareUrl ?? `https://capsul.app/shared/${entry.date}`; // TODO: remplacer avec la vraie URL
  const [shareStep, setShareStep] = useState<'idle' | 'confirming'>('idle');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const moodEmoji = MOOD_EMOJI[entry.mood];

  const handleShare = () => {
    setIsOpen(true);
    setShareStep('confirming');
    // TODO: POST /api/memories/:id/share
  };

  const handleMakePrivate = () => {
    setIsOpen(false);
    // TODO: PATCH /api/memories/:id { isOpen: false }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex flex-col gap-5">

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-verylightorange">
                {moodEmoji}
              </div>
              <div>
                <p className="text-xs font-bold text-darkgrey tracking-widest leading-tight">
                  {formatFullDate(entry.date)}
                </p>
                <p className="text-xs text-mediumgrey mt-0.5">Mood: {entry.mood}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-verylightorange flex items-center justify-center shrink-0 hover:bg-lightgrey transition-colors"
            >
              <X size={14} className="text-darkgrey" />
            </button>
          </div>

          <p className="text-darkgrey text-base font-semibold leading-relaxed">{entry.content}</p>

          {entry.media && (
            <img
              src={entry.media}
              alt="Memory"
              className="w-full rounded object-contain"
            />
          )}

          {entry.friendContributions.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Heart size={15} className="text-pink" />
                <span className="font-bold text-darkgrey text-sm">Friends Memories</span>
              </div>
              {entry.friendContributions.map(contrib => (
                <div key={contrib.id} className="flex gap-3">
                  <Avatar name={contrib.guestName} src={contrib.avatarURL ?? undefined} size="sm" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-darkgrey text-sm">{contrib.guestName}</span>
                      <span className="text-xs text-mediumgrey">{contrib.date}</span>
                    </div>
                    <p className="text-sm text-darkgrey leading-relaxed">{contrib.content}</p>
                    {contrib.media && (
                      <img src={contrib.media} alt="" className="rounded-xl w-40 object-cover mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {shareStep === 'confirming' && (
            <div className="bg-yellow/30 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
              <Users size={28} className="text-darkgrey" />
              <div>
                <p className="font-bold text-darkgrey">Memory Shared!</p>
                <p className="text-sm text-mediumgrey mt-1 leading-relaxed">
                  Your friends can now see this memory and add their own photos and comments
                </p>
              </div>
              <div className="w-full bg-white rounded-xl p-4 flex flex-col gap-2">
                <p className="text-xs font-bold text-mediumgrey tracking-widest">SHARE THIS LINK:</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-darkgrey truncate flex-1">{shareUrl}</p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-8 h-8 bg-darkgrey rounded-full flex items-center justify-center shrink-0"
                  >
                    <Copy size={12} className="text-white" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-mediumgrey flex items-center gap-1.5">
                <Link2 size={11} />
                Anyone with this link can view and contribute
              </p>
              <Button variant="secondary" fullWidth onClick={() => setShareStep('idle')}>
                Done
              </Button>
            </div>
          )}

          {shareStep === 'idle' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOpen
                    ? <><Users size={15} className="text-mediumgrey" /><span className="text-sm text-mediumgrey font-semibold">Shared with friends</span></>
                    : <><Lock  size={15} className="text-mediumgrey" /><span className="text-sm text-mediumgrey font-semibold">Private capsul</span></>
                  }
                </div>
                {isOpen
                  ? <Button variant="secondary" size="sm" onClick={handleMakePrivate}>Make Private</Button>
                  : <Button variant="primary"   size="sm" onClick={handleShare}>Share with Friends</Button>
                }
              </div>
              {isOpen && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-verylightorange rounded-xl px-3 py-2.5">
                    <p className="text-xs text-darkgrey truncate flex-1">{shareUrl}</p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-7 h-7 bg-darkgrey rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                    >
                      {copied
                        ? <span className="text-white text-[10px] font-bold">✓</span>
                        : <Copy size={11} className="text-white" />
                      }
                    </button>
                  </div>
                  {/* TODO: supprimer ce bouton — lien temporaire pour prévisualiser la vue invité */}
                  {onPreviewGuest && (
                    <button
                      type="button"
                      onClick={onPreviewGuest}
                      className="flex items-center justify-center gap-1.5 text-xs text-mediumgrey hover:text-darkgrey transition-colors py-1"
                    >
                      <Eye size={12} />
                      Preview guest view
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {confirmDelete ? (
            <div className="bg-verylightpink/50 rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-center">
                <p className="text-lg font-black text-darkgrey">Delete this memory?</p>
                <p className="text-sm pb-0 mb-0 text-darkgrey/70 leading-relaxed">
                  This capsul will be gone forever. There's no way to recover it.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3.5 bg-white rounded-2xl text-darkgrey font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 py-3.5 bg-pink rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-4 bg-lightpink rounded-2xl text-pink font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Delete Capsul
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
