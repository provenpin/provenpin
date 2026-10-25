import mittModule, { type Emitter } from "mitt";

// mitt 3.0.1 ships CommonJS-format typings ("export default" in a package without "type": "module"), so under
// module: nodenext tsc types the default import as the module object. Node loads the ESM build (dist/mitt.mjs),
// whose default export is the function itself; this cast only fixes the type, the runtime value is unchanged.
const mitt = mittModule as unknown as typeof mittModule.default;

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
