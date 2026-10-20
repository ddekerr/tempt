import { z } from 'zod';

export const ROLES = ['male', 'female'] as const;

export const RoleSchema = z.enum(ROLES);

export type Role = z.infer<typeof RoleSchema>;

export interface PlayerInfo {
  name: string;
}

export type Players = Record<Role, PlayerInfo>;

export const partnerOf = (role: Role): Role => (role === 'male' ? 'female' : 'male');
