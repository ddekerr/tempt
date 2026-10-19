import { networkInterfaces } from 'node:os';

/** Перша зовнішня IPv4-адреса комп'ютера в локальній мережі (для QR-кодів). */
export function getLanIp(): string | undefined {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return undefined;
}
