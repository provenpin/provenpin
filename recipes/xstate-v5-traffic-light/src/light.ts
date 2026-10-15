import { createMachine, createActor, assign } from "xstate";

export type LightContext = { cycles: number };

export const lightMachine = createMachine({
  id: "light",
  initial: "red",
  types: {} as { context: LightContext; events: { type: "NEXT" } | { type: "EMERGENCY" } },
  context: { cycles: 0 },
  states: {
    red: {
      on: {
        NEXT: { target: "green", actions: assign({ cycles: ({ context }) => context.cycles + 1 }) },
        EMERGENCY: "flashing",
      },
    },
    green: {
      on: {
        NEXT: "yellow",
        EMERGENCY: "flashing",
      },
    },
    yellow: {
      on: {
        NEXT: "red",
        EMERGENCY: "flashing",
      },
    },
    flashing: {
      on: {
        NEXT: "red",
      },
    },
  },
});

export function startLight() {
  const actor = createActor(lightMachine);
  actor.start();
  return {
    value: () => actor.getSnapshot().value,
    cycles: () => actor.getSnapshot().context.cycles,
    next() {
      actor.send({ type: "NEXT" });
    },
    emergency() {
      actor.send({ type: "EMERGENCY" });
    },
    stop() {
      actor.stop();
    },
  };
}
