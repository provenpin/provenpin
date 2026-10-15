import * as Y from "yjs";

/** Exchange only the missing updates between two docs using state vectors (the y-protocols sync step 1/2). */
export function syncDocs(a: Y.Doc, b: Y.Doc) {
  const aMissing = Y.encodeStateAsUpdate(b, Y.encodeStateVector(a));
  const bMissing = Y.encodeStateAsUpdate(a, Y.encodeStateVector(b));
  Y.applyUpdate(a, aMissing, "remote");
  Y.applyUpdate(b, bMissing, "remote");
  return { aBytes: aMissing.byteLength, bBytes: bMissing.byteLength };
}

export function newDoc(clientID: number) {
  const d = new Y.Doc();
  d.clientID = clientID; // fixed ids make conflict resolution deterministic in tests
  return d;
}

/** Wire a doc pair so each local update is relayed to the other, like a websocket provider would. */
export function connect(a: Y.Doc, b: Y.Doc) {
  const relay = (to: Y.Doc) => (update: Uint8Array, origin: unknown) => {
    if (origin !== "remote") Y.applyUpdate(to, update, "remote");
  };
  const ha = relay(b), hb = relay(a);
  a.on("update", ha);
  b.on("update", hb);
  return () => { a.off("update", ha); b.off("update", hb); };
}
