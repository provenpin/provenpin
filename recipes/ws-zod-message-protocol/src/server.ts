import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import { z } from "zod";

/** Client to server messages, as a discriminated union on "type". */
export const ClientMsg = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), room: z.string().min(1).max(32) }),
  z.object({ type: z.literal("say"), room: z.string(), text: z.string().min(1).max(500) }),
  z.object({ type: z.literal("ping"), id: z.number().int() }),
]);
export type ServerMsg =
  | { type: "welcome"; user: string }
  | { type: "joined"; room: string; members: number }
  | { type: "message"; room: string; from: string; text: string }
  | { type: "pong"; id: number }
  | { type: "error"; code: "bad_json" | "invalid" | "not_in_room"; detail?: string };

const send = (ws: WebSocket, msg: ServerMsg) => ws.send(JSON.stringify(msg));

/**
 * A room chat server on ws. Auth is a token in the upgrade URL, checked in verifyClient-style
 * handling of the "connection" request; every inbound frame is validated with Zod.
 */
export function startServer(tokens: Record<string, string>, port = 0) {
  const wss = new WebSocketServer({ port });
  const rooms = new Map<string, Set<WebSocket>>();
  const userOf = new WeakMap<WebSocket, string>();

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const token = new URL(req.url ?? "/", "http://localhost").searchParams.get("token") ?? "";
    const user = tokens[token];
    if (!user) return ws.close(4401, "unauthorized");
    userOf.set(ws, user);
    send(ws, { type: "welcome", user });

    ws.on("message", (raw) => {
      let data: unknown;
      try { data = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", code: "bad_json" }); }
      const parsed = ClientMsg.safeParse(data);
      if (!parsed.success) return send(ws, { type: "error", code: "invalid", detail: parsed.error.issues[0].path.join(".") || parsed.error.issues[0].message });
      const msg = parsed.data;
      switch (msg.type) {
        case "ping":
          return send(ws, { type: "pong", id: msg.id });
        case "join": {
          const set = rooms.get(msg.room) ?? new Set();
          set.add(ws);
          rooms.set(msg.room, set);
          return send(ws, { type: "joined", room: msg.room, members: set.size });
        }
        case "say": {
          const set = rooms.get(msg.room);
          if (!set?.has(ws)) return send(ws, { type: "error", code: "not_in_room" });
          for (const peer of set) if (peer.readyState === WebSocket.OPEN) send(peer, { type: "message", room: msg.room, from: user, text: msg.text });
        }
      }
    });

    ws.on("close", () => { for (const set of rooms.values()) set.delete(ws); });
  });

  const ready = new Promise<number>((resolve) => wss.on("listening", () => resolve((wss.address() as { port: number }).port)));
  return { wss, ready, close: () => new Promise<void>((r) => { for (const c of wss.clients) c.terminate(); wss.close(() => r()); }) };
}
