import type { Role } from './roles';
import type { SlotStatus } from './room';

/** Адреса й QR-код (data URL) для кожної ролі. Віддається лише комп'ютеру. */
export type HostQr = Record<Role, { url: string; qr: string }>;

export type HostStatus = Record<Role, SlotStatus>;
