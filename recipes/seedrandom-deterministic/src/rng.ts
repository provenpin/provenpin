import seedrandom from "seedrandom";

export type Rng = () => number;

export function createRng(seed: string): Rng {
  return seedrandom(seed) as Rng;
}

export function createAleaRng(seed: string): Rng {
  return seedrandom.alea(seed) as Rng;
}

export function take(rng: Rng, count: number): number[] {
  return Array.from({ length: count }, () => rng());
}

export function withSeededMath<T>(seed: string, fn: () => T): T {
  const originalRandom = Math.random;
  const originalSeedrandom = (Math as { seedrandom?: unknown }).seedrandom;
  seedrandom(seed, { global: true });
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
    if (originalSeedrandom === undefined) {
      delete (Math as { seedrandom?: unknown }).seedrandom;
    } else {
      (Math as { seedrandom?: unknown }).seedrandom = originalSeedrandom;
    }
  }
}
