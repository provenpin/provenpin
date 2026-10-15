import mitt, { type Emitter } from "mitt";

export type AppEvents = {
  "user:created": { id: string; email: string };
  "order:paid": { orderId: string; total: number };
  error: Error;
};

export function createBus(): Emitter<AppEvents> & {
  once<K extends keyof AppEvents>(type: K, handler: (event: AppEvents[K]) => void): () => void;
} {
  const bus = mitt<AppEvents>();
  return Object.assign(bus, {
    once<K extends keyof AppEvents>(type: K, handler: (event: AppEvents[K]) => void) {
      const wrap = (event: AppEvents[K]) => {
        bus.off(type, wrap);
        handler(event);
      };
      bus.on(type, wrap);
      return () => bus.off(type, wrap);
    },
  });
}
