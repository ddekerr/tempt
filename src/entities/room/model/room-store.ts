import { create } from 'zustand';
import { CLOSE_REPLACED, CLOSE_RESET, type ServerMessage } from '@core/protocol';
import type { Role } from '@core/roles';
import type { RoomView } from '@core/room';
import { openSocket, type ReconnectingSocket, type SocketStatus } from '@/shared/api';
import { loadSession, saveSession } from '../lib/saved-session';

interface RoomStoreState {
  role: Role | null;
  connection: SocketStatus;
  /** Сервер підтвердив вхід у слот. */
  joined: boolean;
  view: RoomView | null;
  error: string | null;

  open: (role: Role) => void;
  close: () => void;
  join: (name: string) => void;
  enterGame: (gameId: string) => void;
  leaveGame: () => void;
  setReady: (ready: boolean) => void;
}

const initial = { role: null, connection: 'closed', joined: false, view: null, error: null } as const;

// Сокет і поточний вхід живуть поза станом: це не те, що малюється.
let socket: ReconnectingSocket | null = null;
let session: { role: Role; name: string; token?: string } | null = null;

export const useRoomStore = create<RoomStoreState>()((set, get) => {
  const send = (message: unknown) => socket?.send(message);

  function sendJoin() {
    if (session) send({ type: 'join', name: session.name, token: session.token });
  }

  function handleMessage(message: ServerMessage) {
    switch (message.type) {
      case 'joined':
        if (session) {
          session.token = message.token;
          saveSession(session.role, { token: message.token, name: session.name });
        }
        set({ joined: true, error: null });
        return;
      case 'roomUpdate':
        set({ view: message.room });
        return;
      case 'error':
        // якщо вхід не вдався (роль зайнята), показуємо форму входу знов
        if (!get().joined) session = null;
        set({ error: message.message });
        return;
    }
  }

  return {
    ...initial,

    open: (role) => {
      socket?.close();
      session = null;
      set({ ...initial, role, connection: 'connecting' });

      socket = openSocket(`/ws?role=${role}`, {
        onMessage: (data) => handleMessage(data as ServerMessage),
        onStatus: (connection) => {
          set({ connection });
          // після перепідключення в межах цієї сторінки входимо автоматично
          if (connection === 'open') sendJoin();
        },
        onFatalClose: (code) => {
          session = null;
          if (code === CLOSE_RESET)
            set({ joined: false, view: null, error: "Тебе скинули з комп'ютера. Увійди знову." });
          else if (code === CLOSE_REPLACED) set({ joined: false, view: null, error: 'Відкрито в іншому вікні.' });
          else set({ joined: false, view: null, error: 'Не вдалося підключитися.' });
        },
      });
    },

    close: () => {
      socket?.close();
      socket = null;
      session = null;
      set(initial);
    },

    join: (name) => {
      const role = get().role;
      if (!role) return;
      session = { role, name, token: loadSession(role).token };
      set({ error: null });
      sendJoin();
    },

    enterGame: (gameId) => {
      set({ error: null });
      send({ type: 'enterGame', gameId });
    },
    leaveGame: () => {
      set({ error: null });
      send({ type: 'leaveGame' });
    },
    setReady: (ready) => {
      set({ error: null });
      send({ type: 'setReady', ready });
    },
  };
});
