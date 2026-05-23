import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { defaultNotifier } from "@/services/utils/notificationBus";

declare global {
  // eslint-disable-next-line no-var
  var socketIOServer: SocketIOServer | undefined;
}

export function createSocketServer(server: HttpServer) {
  if (global.socketIOServer) {
    return global.socketIOServer;
  }

  const io = new SocketIOServer(server, {
    path: "/api/socketio",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("notification", {
      type: "socket.connected",
      payload: { socketId: socket.id },
      createdAt: new Date(),
    });
  });

  defaultNotifier.attachSocketServer(io);
  global.socketIOServer = io;
  return io;
}
