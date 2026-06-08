/**
 * Per-tick input frame.
 *
 * Source-agnostic bit flags (keyboard now, gamepad later).
 */

import { z } from 'zod';

export interface InputFrame {
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  drift: boolean;
}

/** Packed as a single byte for network efficiency. */
export function packInput(input: InputFrame): number {
  let flags = 0;
  if (input.accelerate) flags |= 1 << 0;
  if (input.brake) flags |= 1 << 1;
  if (input.steerLeft) flags |= 1 << 2;
  if (input.steerRight) flags |= 1 << 3;
  if (input.drift) flags |= 1 << 4;
  return flags;
}

/** Unpack from a single byte. */
export function unpackInput(flags: number): InputFrame {
  return {
    accelerate: (flags & (1 << 0)) !== 0,
    brake: (flags & (1 << 1)) !== 0,
    steerLeft: (flags & (1 << 2)) !== 0,
    steerRight: (flags & (1 << 3)) !== 0,
    drift: (flags & (1 << 4)) !== 0,
  };
}

/** Zod schema for network validation. */
export const InputFrameSchema = z.object({
  accelerate: z.boolean(),
  brake: z.boolean(),
  steerLeft: z.boolean(),
  steerRight: z.boolean(),
  drift: z.boolean(),
});

export type InputFrameZ = z.infer<typeof InputFrameSchema>;
