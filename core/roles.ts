export const ROLES = ['male', 'female'] as const;

export type Role = (typeof ROLES)[number];

export interface PlayerInfo {
  name: string;
}

export type Players = Record<Role, PlayerInfo>;
