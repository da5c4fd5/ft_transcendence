import { useEffect, useMemo, useState } from 'preact/hooks';
import { MessageCircle, Send } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Avatar } from '../../components/Avatar/Avatar';
import { api, getApiErrorMessage } from '../../lib/api';
import { useRealtime } from '../../lib/realtime';
import type { ChatFriend, ChatMessage } from './chat.types';

const MAX_CHAT_CHARS = 500;

type RawFriendUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  online: boolean;
};

type RawFriend = {
  id: string;
  requesterId: string;
  recipientId: string;
  requester: RawFriendUser;
  recipient: RawFriendUser;
};

type ChatPageProps = {
  currentUserId: string;
};

function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapFriend(currentUserId: string, raw: RawFriend): ChatFriend {
  const other = raw.requesterId === currentUserId ? raw.recipient : raw.requester;
  return {
    id: other.id,
    username: other.username,
    avatarUrl: other.avatarUrl,
    online: other.online,
  };
}

export function ChatPage({ currentUserId }: ChatPageProps) {
  const { onlineUserIds, presenceReady } = useRealtime();
  const [friends, setFriends] = useState<ChatFriend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId) ?? null,
    [friends, selectedFriendId],
  );

  const visibleFriends = useMemo(
    () =>
      friends.map((friend) => ({
        ...friend,
        online: presenceReady ? onlineUserIds.has(friend.id) : friend.online,
      })),
    [friends, onlineUserIds, presenceReady],
  );

  const refreshFriends = async () => {
    const raw = await api.get<RawFriend[]>('/friends');
    const mapped = raw.map((friend) => mapFriend(currentUserId, friend));
    setFriends(mapped);
    setSelectedFriendId((current) => {
      if (current && mapped.some((friend) => friend.id === current)) return current;
      return mapped[0]?.id ?? null;
    });
  };

  const loadMessages = async (friendId: string) => {
    setLoadingMessages(true);
    try {
      const nextMessages = await api.get<ChatMessage[]>(
        `/chat/${friendId}/messages?limit=50`,
      );
      setMessages(nextMessages);
      setError(null);
    } catch (err) {
      setMessages([]);
      setError(getApiErrorMessage(err, 'Failed to load messages.'));
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    setLoadingFriends(true);
    refreshFriends()
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load your friends.')))
      .finally(() => setLoadingFriends(false));
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedFriendId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedFriendId).catch(() => {});
  }, [selectedFriendId]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{
        type: 'chat_message';
        message: ChatMessage;
      }>).detail;
      const message = detail?.message;
      if (!message) return;

      const friendId =
        message.senderId === currentUserId ? message.recipientId : message.senderId;

      if (selectedFriendId === friendId) {
        setMessages((prev) =>
          prev.some((item) => item.id === message.id) ? prev : [...prev, message],
        );
      }
    };

    window.addEventListener('capsul:chat-message', handler as EventListener);
    return () => window.removeEventListener('capsul:chat-message', handler as EventListener);
  }, [currentUserId, selectedFriendId]);

  const handleSend = async (e: Event) => {
    e.preventDefault();
    if (!selectedFriendId || !draft.trim()) return;

    setSending(true);
    setError(null);
    try {
      const message = await api.post<ChatMessage>(
        `/chat/${selectedFriendId}/messages`,
        { content: draft.trim() },
      );
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      );
      setDraft('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send the message.'));
    } finally {
      setSending(false);
    }
  };

  if (loadingFriends) {
    return null;
  }

  if (visibleFriends.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow/40 flex items-center justify-center">
            <MessageCircle size={22} className="text-darkgrey" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-darkgrey">No chat yet</h1>
            <p className="text-sm text-mediumgrey mt-2 leading-relaxed">
              Add and accept friends from your profile to start sending direct messages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 lg:py-8">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="bg-white rounded-3xl p-4 shadow-sm flex flex-col gap-2">
          <div className="px-2 pb-2">
            <h1 className="text-xl font-black text-darkgrey">Chat</h1>
            <p className="text-sm text-mediumgrey mt-1">Direct messages with your accepted friends.</p>
          </div>

          {visibleFriends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => setSelectedFriendId(friend.id)}
              className={cn(
                'w-full rounded-2xl px-3 py-3 flex items-center gap-3 text-left transition-colors',
                selectedFriendId === friend.id ? 'bg-yellow/50' : 'hover:bg-verylightorange',
              )}
            >
              <div className="relative">
                <Avatar name={friend.username} src={friend.avatarUrl} size="md" />
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                    friend.online ? 'bg-blue' : 'bg-lightgrey',
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-darkgrey truncate">{friend.username}</p>
                <p className="text-xs text-mediumgrey">
                  {friend.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>
          ))}
        </aside>

        <section className="bg-white rounded-3xl shadow-sm min-h-[70vh] flex flex-col overflow-hidden">
          {selectedFriend ? (
            <>
              <div className="px-6 py-5 border-b border-black/5 flex items-center gap-3">
                <div className="relative">
                  <Avatar name={selectedFriend.username} src={selectedFriend.avatarUrl} size="md" />
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                      (presenceReady ? onlineUserIds.has(selectedFriend.id) : selectedFriend.online) ? 'bg-blue' : 'bg-lightgrey',
                    )}
                  />
                </div>
                <div>
                  <h2 className="font-black text-darkgrey text-lg">{selectedFriend.username}</h2>
                  <p className="text-xs text-mediumgrey">
                    {(presenceReady ? onlineUserIds.has(selectedFriend.id) : selectedFriend.online) ? 'Online now' : 'Currently offline'}
                  </p>
                </div>
              </div>

              <div className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto flex flex-col gap-3 bg-verylightorange/40">
                {loadingMessages ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-mediumgrey">
                    Loading conversation…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-mediumgrey text-center px-6">
                    Start the conversation. Your messages are saved and can be reopened later.
                  </div>
                ) : (
                  messages.map((message) => {
                    const own = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'max-w-[85%] rounded-3xl px-4 py-3 shadow-sm',
                          own
                            ? 'self-end bg-yellow text-darkgrey rounded-br-lg'
                            : 'self-start bg-white text-darkgrey rounded-bl-lg',
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={cn('text-[11px] mt-2', own ? 'text-darkgrey/70' : 'text-mediumgrey')}>
                          {formatChatTime(message.createdAt)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-black/5 flex flex-col gap-3">
                <textarea
                  value={draft}
                  onInput={(e) => {
                    setDraft((e.target as HTMLTextAreaElement).value);
                    setError(null);
                  }}
                  maxLength={MAX_CHAT_CHARS}
                  rows={3}
                  placeholder={`Message ${selectedFriend.username}...`}
                  className="w-full bg-verylightorange rounded-3xl px-4 py-3 outline-none text-darkgrey placeholder:text-mediumgrey resize-none border-2 border-transparent focus:border-yellow transition-colors"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-mediumgrey">
                    {draft.length}/{MAX_CHAT_CHARS}
                  </span>
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-darkgrey text-white px-4 py-2 text-sm font-semibold disabled:opacity-40 transition-opacity"
                  >
                    <Send size={14} />
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
                {error && <p className="text-xs text-pink px-1">{error}</p>}
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-mediumgrey">
              Select a friend to start chatting.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
