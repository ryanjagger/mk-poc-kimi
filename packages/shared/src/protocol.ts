/**
 * Shared network protocol with Zod validation.
 *
 * All messages are typed and validated at the boundary.
 */

import { z } from 'zod';
import { InputFrameSchema } from './input';

export const JoinRoomMessage = z.object({
  type: z.literal('joinRoom'),
  roomCode: z.string(),
  playerName: z.string(),
});

export const CreateRoomMessage = z.object({
  type: z.literal('createRoom'),
  playerName: z.string(),
});

export const ReadyMessage = z.object({
  type: z.literal('ready'),
  roomCode: z.string(),
});

export const StartMessage = z.object({
  type: z.literal('start'),
  roomCode: z.string(),
});

export const InputFrameMessage = z.object({
  type: z.literal('inputFrame'),
  tick: z.number().int().nonnegative(),
  playerIndex: z.number().int().nonnegative(),
  input: InputFrameSchema,
});

export const HashReportMessage = z.object({
  type: z.literal('hashReport'),
  tick: z.number().int().nonnegative(),
  hash: z.number().int().nonnegative(),
});

export const SyncMessage = z.object({
  type: z.literal('sync'),
  tick: z.number().int().nonnegative(),
});

export const ProtocolMessage = z.discriminatedUnion('type', [
  JoinRoomMessage,
  CreateRoomMessage,
  ReadyMessage,
  StartMessage,
  InputFrameMessage,
  HashReportMessage,
  SyncMessage,
]);

export type ProtocolMessage = z.infer<typeof ProtocolMessage>;

export type JoinRoomMessage = z.infer<typeof JoinRoomMessage>;
export type CreateRoomMessage = z.infer<typeof CreateRoomMessage>;
export type ReadyMessage = z.infer<typeof ReadyMessage>;
export type StartMessage = z.infer<typeof StartMessage>;
export type InputFrameMessage = z.infer<typeof InputFrameMessage>;
export type HashReportMessage = z.infer<typeof HashReportMessage>;
export type SyncMessage = z.infer<typeof SyncMessage>;
