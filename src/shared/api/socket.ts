export type SocketStatus = 'connecting' | 'open' | 'closed';

interface SocketHandlers {
  onMessage: (data: unknown) => void;
  onStatus: (status: SocketStatus) => void;
  /** Сервер закрив з'єднання кодом від 4000: автоматично не перепідключаємось. */
  onFatalClose?: (code: number) => void;
}

export interface ReconnectingSocket {
  send: (message: unknown) => void;
  close: () => void;
}

const RETRY_MS = 1000;

/** WebSocket на тому ж хості, що й сторінка. Сам перепідключається, якщо телефон заснув або Wi-Fi моргнув. */
export function openSocket(path: string, handlers: SocketHandlers): ReconnectingSocket {
  let socket: WebSocket | null = null;
  let stopped = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function connect() {
    handlers.onStatus('connecting');
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const current = new WebSocket(`${protocol}://${location.host}${path}`);
    socket = current;

    current.onopen = () => handlers.onStatus('open');

    current.onmessage = (event) => {
      try {
        handlers.onMessage(JSON.parse(String(event.data)));
      } catch {
        // повідомлення не JSON, ігноруємо
      }
    };

    current.onclose = (event) => {
      handlers.onStatus('closed');
      if (stopped) return;
      if (event.code >= 4000) {
        stopped = true;
        handlers.onFatalClose?.(event.code);
        return;
      }
      retryTimer = setTimeout(connect, RETRY_MS);
    };
  }

  connect();

  return {
    send: (message) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    },
    close: () => {
      stopped = true;
      clearTimeout(retryTimer);
      socket?.close();
    },
  };
}
