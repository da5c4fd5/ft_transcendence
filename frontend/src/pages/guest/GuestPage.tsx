import { useState, useRef } from 'preact/hooks';
import { ArrowLeft, Camera, Heart, Send, User, Pencil, X } from 'lucide-preact';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Avatar } from '../../components/Avatar/Avatar';
import { Button } from '../../components/Button/Button';
import { MediaPreview } from '../../components/MediaPreview/MediaPreview';
import type { FriendContribution, SharedMemory, GuestPageProps } from './guest.types';
import { api, getApiErrorMessage, validateImageFile } from '../../lib/api';

const MAX_CONTENT_LENGTH = 180;

type RawContribution = {
  id: string;
  content: string;
  guestName: string | null;
  guestAvatarUrl: string | null;
  mediaUrl: string | null;
  createdAt: string;
  contributor: { username: string; avatarUrl: string | null } | null;
};

function rawToFriendContribution(c: RawContribution): FriendContribution {
  return {
    id: c.id,
    guestName: c.guestName ?? c.contributor?.username ?? 'Anonymous',
    avatarURL: c.contributor?.avatarUrl ?? c.guestAvatarUrl ?? null,
    date: c.createdAt.slice(0, 10),
    content: c.content,
    media: c.mediaUrl ?? null,
  };
}

function readImageAsDataUrl(file: File, onLoad: (result: string) => void) {
  const reader = new FileReader();
  reader.onload = (ev) => onLoad(ev.target?.result as string);
  reader.readAsDataURL(file);
}

function JoinStep({ onJoin }: { onJoin: (username: string, avatarURL: string | null) => void }) {
  const [username, setUsername] = useState('');
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const imageError = validateImageFile(file);
    if (imageError) {
      setAvatarURL(null);
      setError(imageError);
      input.value = '';
      return;
    }
    setError(null);
    readImageAsDataUrl(file, setAvatarURL);
    input.value = '';
  };

  return (
    <div className="min-h-screen bg-verylightyellow flex flex-col items-center justify-center px-6 py-12 gap-8">

      <AppLogo size="sm" iconColor="text-yellow" textColor="text-darkgrey" subtitle="You're invited! ✨" />

      <div className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col gap-6 shadow-lg">

        <div className="bg-verylightorange rounded-2xl p-4 text-center">
          <p className="text-sm text-darkgrey leading-relaxed">
            <span className="font-bold">CAPSUL</span> is a cozy vault where memories grow into a virtual tree.
            Your friend wants you to add your spark to this shared moment!
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="relative w-fit">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-mediumgrey/40 flex items-center justify-center hover:border-mediumgrey transition-colors overflow-hidden"
            >
              {avatarURL
                ? <img src={avatarURL} alt="avatar" className="w-full h-full object-cover" />
                : <User size={28} className="text-mediumgrey/60" />
              }
            </button>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-darkgrey rounded-full flex items-center justify-center pointer-events-none">
              <Camera size={11} className="text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">PROFILE PHOTO (OPTIONAL)</span>
          {error && <p className="text-xs text-pink text-center max-w-xs">{error}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-darkgrey">What's your name?</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            className="w-full px-4 py-3 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-darkgrey placeholder:text-mediumgrey text-sm transition-colors"
          />
        </div>

        <Button variant="primary" fullWidth disabled={!username.trim()} onClick={() => onJoin(username.trim(), avatarURL)}>
          Join the memory
        </Button>
      </div>
    </div>
  );
}

function SharedMemoryView({ memory, guestName, guestAvatarURL, onBack, onNavigateToWelcome, isLoggedIn }: {
  memory: SharedMemory;
  guestName: string;
  guestAvatarURL: string | null;
  onBack: () => void;
  onNavigateToWelcome?: () => void;
  isLoggedIn: boolean;
}) {
  const [contributionContent, setContributionContent] = useState('');
  const [contributionMedia, setContributionMedia] = useState<string | null>(null);
  const [contributions, setContributions] = useState<FriendContribution[]>(memory.friendContributions);
  const [sent, setSent] = useState(false);
  const [mySessionIds, setMySessionIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const canEdit = (contrib: FriendContribution) =>
    mySessionIds.has(contrib.id) || (isLoggedIn && contrib.guestName === guestName);

  const handleMediaChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const imageError = validateImageFile(file);
    if (imageError) {
      setContributionMedia(null);
      setSubmitError(imageError);
      input.value = '';
      return;
    }
    setSubmitError(null);
    readImageAsDataUrl(file, setContributionMedia);
    input.value = '';
  };

  const handleEditMediaChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const imageError = validateImageFile(file);
    if (imageError) {
      setEditMedia(null);
      setEditError(imageError);
      input.value = '';
      return;
    }
    setEditError(null);
    readImageAsDataUrl(file, setEditMedia);
    input.value = '';
  };

  const handleSend = async () => {
    if (!contributionContent.trim() || isSending) return;
    if (!memory.id) {
      setSubmitError('Failed to send contribution.');
      return;
    }

    setIsSending(true);
    setSubmitError(null);
    setSent(false);

    try {
      const saved = await api.post<RawContribution>(`/memories/${memory.id}/contributions`, {
        content: contributionContent.trim(),
        ...(isLoggedIn ? {} : {
          guestName,
          ...(guestAvatarURL ? { guestAvatarUrl: guestAvatarURL } : {}),
        }),
        ...(contributionMedia ? { mediaUrl: contributionMedia } : {}),
      });
      const savedContrib = rawToFriendContribution(saved);
      setContributions(prev => [...prev, savedContrib]);
      setMySessionIds(prev => new Set(prev).add(saved.id));
      setContributionContent('');
      setContributionMedia(null);
      setSent(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to send contribution.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleEditStart = (contrib: FriendContribution) => {
    setEditingId(contrib.id);
    setEditContent(contrib.content);
    setEditMedia(contrib.media);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editContent.trim() || !editingId || isSavingEdit) return;

    if (!isLoggedIn || !memory.id) {
      setContributions(prev => prev.map(c =>
        c.id === editingId ? { ...c, content: editContent.trim(), media: editMedia } : c
      ));
      setEditError(null);
      setEditingId(null);
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      const saved = await api.patch<RawContribution>(`/memories/${memory.id}/contributions/${editingId}`, {
        content: editContent.trim(),
        ...(editMedia ? { mediaUrl: editMedia } : {}),
      });
      const savedContrib = rawToFriendContribution(saved);
      setContributions(prev => prev.map(c => c.id === editingId ? savedContrib : c));
      setEditingId(null);
    } catch (err) {
      setEditError(getApiErrorMessage(err, 'Failed to save changes.'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditError(null);
  };

  return (
    <div className="min-h-screen bg-orange/30">

      <div className="px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-sm font-semibold text-darkgrey shadow-sm hover:shadow-md transition-shadow"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pb-12 flex flex-col gap-4">

        <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
          <p className="text-xs font-bold text-mediumgrey tracking-widest">{memory.date}</p>
          <p className="text-darkgrey text-base font-semibold leading-relaxed">"{memory.content}"</p>
          {memory.media && (
            <MediaPreview src={memory.media} alt="Memory" className="w-full rounded-2xl object-cover max-h-64" />
          )}
          <div className="flex items-center gap-2 pt-1 border-t border-black/5">
            <Heart size={13} className="text-pink" />
            <span className="text-xs text-mediumgrey">
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {contributions.length > 0 && (
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Heart size={15} className="text-pink" />
              <span className="font-bold text-darkgrey text-sm">Friend Contributions</span>
            </div>
            {contributions.map(contrib => (
              <div key={contrib.id} className="flex gap-3">
                <Avatar name={contrib.guestName} src={contrib.avatarURL ?? undefined} size="sm" />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-darkgrey text-sm">{contrib.guestName}</span>
                      <span className="text-xs text-mediumgrey">{contrib.date}</span>
                    </div>
                    {canEdit(contrib) && editingId !== contrib.id && (
                      <button
                        type="button"
                        onClick={() => handleEditStart(contrib)}
                        className="flex items-center gap-1 text-xs text-mediumgrey hover:text-darkgrey transition-colors shrink-0"
                      >
                        <Pencil size={11} />
                        Edit
                      </button>
                    )}
                  </div>

                  {editingId === contrib.id ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea
                        value={editContent}
                        onInput={(e) => {
                          setEditContent((e.target as HTMLTextAreaElement).value);
                          setEditError(null);
                        }}
                        maxLength={MAX_CONTENT_LENGTH}
                        rows={3}
                        className="w-full bg-verylightorange rounded-2xl px-3 py-2 outline-none text-darkgrey text-sm resize-none border-2 border-transparent focus:border-yellow transition-colors"
                      />
                      <p className="text-[11px] text-mediumgrey px-1">{editContent.length}/{MAX_CONTENT_LENGTH}</p>
                      {editMedia && (
                        <div className="relative w-fit">
                          <MediaPreview src={editMedia} alt="" className="rounded-xl w-40 object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditMedia(null)}
                            className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"
                          >
                            <X size={10} className="text-darkgrey" />
                          </button>
                        </div>
                      )}
                      {editError && <p className="text-xs text-pink px-1">{editError}</p>}
                      <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditMediaChange} />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editFileRef.current?.click()}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${editMedia ? 'bg-pink text-white' : 'bg-verylightorange text-mediumgrey hover:text-darkgrey'}`}
                        >
                          <Camera size={13} />
                        </button>
                        <div className="flex-1" />
                        <button type="button" onClick={handleEditCancel} className="text-xs text-mediumgrey hover:text-darkgrey transition-colors">
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleEditSave}
                          disabled={!editContent.trim() || isSavingEdit}
                          className="flex items-center gap-1.5 bg-darkgrey rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
                        >
                          {isSavingEdit ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-darkgrey leading-relaxed">{contrib.content}</p>
                      {contrib.media && (
                        <MediaPreview src={contrib.media} alt="" className="rounded-xl w-40 object-cover mt-1" />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Heart size={15} className="text-pink" />
            <span className="font-bold text-darkgrey text-sm">Add Your Contribution</span>
          </div>

          {sent && (
            <p className="text-sm text-mediumgrey text-center py-2">
              Your contribution has been added!
            </p>
          )}

          <div className="flex gap-3 items-start">
            <Avatar name={guestName} src={guestAvatarURL ?? undefined} size="sm" />
            <textarea
              placeholder="Share your thoughts or a memory related to this moment..."
              value={contributionContent}
              onInput={(e) => {
                setContributionContent((e.target as HTMLTextAreaElement).value);
                setSent(false);
                setSubmitError(null);
              }}
              maxLength={MAX_CONTENT_LENGTH}
              rows={3}
              className="flex-1 bg-verylightorange rounded-2xl px-4 py-3 outline-none text-darkgrey placeholder:text-mediumgrey text-sm resize-none border-2 border-transparent focus:border-yellow transition-colors"
            />
          </div>

          <p className="text-[11px] text-mediumgrey px-1">{contributionContent.length}/{MAX_CONTENT_LENGTH}</p>

          {contributionMedia && (
            <MediaPreview src={contributionMedia} alt="" className="rounded-2xl w-40 object-cover" />
          )}

          {submitError && <p className="text-xs text-pink px-1">{submitError}</p>}

          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleMediaChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${contributionMedia ? 'bg-pink text-white' : 'bg-verylightorange text-mediumgrey hover:text-darkgrey'}`}
            >
              <Camera size={16} />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSend}
              disabled={!contributionContent.trim() || isSending}
              className="flex items-center gap-2 bg-verylightorange rounded-full px-4 py-2 text-sm font-semibold text-darkgrey disabled:opacity-40 hover:bg-orange/20 transition-colors"
            >
              <Send size={13} />
              {isSending ? 'Sending...' : 'Send Contribution'}
            </button>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="text-center py-4 flex flex-col gap-3">
            <p className="text-xs text-mediumgrey">Want to create your own memory tree?</p>
            <Button variant="primary" onClick={onNavigateToWelcome}>Start with CAPSUL</Button>
          </div>
        )}

      </div>
    </div>
  );
}

export function GuestPage({ memory, onBack, onNavigateToWelcome, currentUser }: GuestPageProps) {
  const isLoggedIn = !!currentUser;
  const [step, setStep] = useState<'join' | 'memory'>(isLoggedIn ? 'memory' : 'join');
  const [guestName, setGuestName]         = useState(currentUser?.username ?? '');
  const [guestAvatarURL, setGuestAvatarURL] = useState<string | null>(currentUser?.avatarUrl ?? null);

  const handleJoin = (username: string, avatarURL: string | null) => {
    setGuestName(username);
    setGuestAvatarURL(avatarURL);
    setStep('memory');
  };

  const handleBack = isLoggedIn ? onBack : () => setStep('join');

  if (step === 'join') {
    return <JoinStep onJoin={handleJoin} />;
  }

  return (
    <SharedMemoryView
      memory={memory}
      guestName={guestName}
      guestAvatarURL={guestAvatarURL}
      onBack={handleBack}
      onNavigateToWelcome={onNavigateToWelcome}
      isLoggedIn={isLoggedIn}
    />
  );
}
