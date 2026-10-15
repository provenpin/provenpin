import { createServer } from "node:http";
import { Server } from "socket.io";

export function startServer(validTokens: Record<string, string>) {
  const http = createServer();
  const io = new Server(http);
  io.use((socket, next) => {
    const user = validTokens[socket.handshake.auth?.token];
    if (!user) return next(new Error("unauthorized"));
    socket.data.user = user;
    next();
  });
  io.on("connection", (socket) => {
    socket.on("join", (room: string, ack: (ok: boolean) => void) => { socket.join(room); ack(true); });
    socket.on("message", ({ room, text }: { room: string; text: string }) => {
      io.to(room).emit("message", { from: socket.data.user, text });
    });
  });
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    http.listen(0, () => {
      const { port } = http.address() as { port: number };
      resolve({ url: `http://localhost:${port}`, close: () => new Promise((r) => io.close(() => r())) });
    });
  });
}
