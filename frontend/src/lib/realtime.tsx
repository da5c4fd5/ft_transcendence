import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getToken, getWebSocketUrl } from './api';
import { playRandomPingSound } from './ping-audio';

type PresenceSnapshotEvent = {
  type: 'presence_snapshot';
  userIds: string[];
};

type PresenceEvent = {
  type: 'presence';
  userId: string;
  online: boolean;
};

type PingEvent = {
  type: 'ping';
  fromUserId: string;
  fromUsername: string;
};

type PingResultEvent = {
  type: 'ping_result';
  userId: string;
  delivered: boolean;
};

type ChatMessageEvent = {
  type: 'chat_message';
  message: {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    createdAt: string;
  };
};

type RealtimeServerEvent = PresenceSnapshotEvent | PresenceEvent | PingEvent | PingResultEvent | ChatMessageEvent;

type RealtimeContextValue = {
  connected: boolean;
  presenceReady: boolean;
  onlineUserIds: Set<string>;
  sendPing: (userId: string) => boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  presenceReady: false,
  onlineUserIds: new Set(),
  sendPing: () => false,
});

function parseRealtimeEvent(raw: string): RealtimeServerEvent | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RealtimeServerEvent>;
    if (parsed?.type === 'presence_snapshot' && Array.isArray(parsed.userIds)) {
      return { type: 'presence_snapshot', userIds: parsed.userIds.filter((id): id is string => typeof id === 'string') };
    }
    if (parsed?.type === 'presence' && typeof parsed.userId === 'string' && typeof parsed.online === 'boolean') {
      return { type: 'presence', userId: parsed.userId, online: parsed.online };
    }
    if (parsed?.type === 'ping' && typeof parsed.fromUserId === 'string' && typeof parsed.fromUsername === 'string') {
      return { type: 'ping', fromUserId: parsed.fromUserId, fromUsername: parsed.fromUsername };
    }
    if (parsed?.type === 'ping_result' && typeof parsed.userId === 'string' && typeof parsed.delivered === 'boolean') {
      return { type: 'ping_result', userId: parsed.userId, delivered: parsed.delivered };
    }
    if (
      parsed?.type === 'chat_message' &&
      parsed.message &&
      typeof parsed.message === 'object' &&
      typeof parsed.message.id === 'string' &&
      typeof parsed.message.senderId === 'string' &&
      typeof parsed.message.recipientId === 'string' &&
      typeof parsed.message.content === 'string' &&
      typeof parsed.message.createdAt === 'string'
    ) {
      return {
        type: 'chat_message',
        message: {
          id: parsed.message.id,
          senderId: parsed.message.senderId,
          recipientId: parsed.message.recipientId,
          content: parsed.message.content,
          createdAt: parsed.message.createdAt,
        },
      };
    }
  } catch {
    // ignore malformed socket payloads
  }

  return null;
}

export function RealtimeProvider({ enabled, children }: { enabled: boolean; children: ComponentChildren }) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [presenceReady, setPresenceReady] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) {
      shouldReconnectRef.current = false;
      setConnected(false);
      setPresenceReady(false);
      setOnlineUserIds(new Set());
      if (heartbeatIntervalRef.current !== null) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    shouldReconnectRef.current = true;

    const connect = () => {
      const token = getToken();
      const socket = new WebSocket(
        getWebSocketUrl('/realtime', token ? { token } : undefined),
      );
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        if (heartbeatIntervalRef.current !== null) {
          window.clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (socket.readyState !== WebSocket.OPEN) return;
          socket.send(JSON.stringify({ type: 'heartbeat' }));
        }, 5000);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return;

        const message = parseRealtimeEvent(event.data);
        if (!message) return;

        switch (message.type) {
          case 'presence_snapshot':
            setPresenceReady(true);
            setOnlineUserIds(new Set(message.userIds));
            break;
          case 'presence':
            setPresenceReady(true);
            setOnlineUserIds(prev => {
              const next = new Set(prev);
              if (message.online) next.add(message.userId);
              else next.delete(message.userId);
              return next;
            });
            break;
          case 'ping':
            void playRandomPingSound();
            window.dispatchEvent(new CustomEvent('capsul:ping', { detail: message }));
            break;
          case 'ping_result':
            window.dispatchEvent(new CustomEvent('capsul:ping-result', { detail: message }));
            break;
          case 'chat_message':
            window.dispatchEvent(new CustomEvent('capsul:chat-message', { detail: message }));
            break;
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        if (heartbeatIntervalRef.current !== null) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        setConnected(false);
        setPresenceReady(false);

        if (!shouldReconnectRef.current) return;

        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      };
    };

    connect();

    const disconnect = () => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      try {
        socket.send(JSON.stringify({ type: 'disconnecting' }));
      } catch {
        // ignore transport errors during teardown
      }
      socket.close(1000, 'Disconnecting');
    };

    window.addEventListener('pagehide', disconnect);

    return () => {
      shouldReconnectRef.current = false;
      setConnected(false);
      setPresenceReady(false);
      window.removeEventListener('pagehide', disconnect);
      if (heartbeatIntervalRef.current !== null) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const value = useMemo<RealtimeContextValue>(() => ({
    connected,
    presenceReady,
    onlineUserIds,
    sendPing: (userId: string) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return false;

      socket.send(JSON.stringify({ type: 'ping', userId }));
      return true;
    },
  }), [connected, onlineUserIds, presenceReady]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
