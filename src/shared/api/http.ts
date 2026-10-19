export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Запит до нашого сервера. Тіло й відповідь — JSON; помилки приходять як ApiError з текстом від сервера. */
export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    let message = `Помилка ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // тіло відповіді не JSON, лишаємо загальне повідомлення
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Щось пішло не так';
}
