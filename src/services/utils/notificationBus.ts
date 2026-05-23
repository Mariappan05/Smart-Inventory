import { EventEmitter } from "events";
import type { Server as SocketIOServer } from "socket.io";

export type NotificationEvent = {
  type: string;
  payload: unknown;
  createdAt: Date;
};

export type NotificationHandler = (event: NotificationEvent) => void;

export interface Notifier {
  publish(event: NotificationEvent): void;
  on(type: string, handler: NotificationHandler): void;
}

export interface RealtimeNotifier extends Notifier {
  attachSocketServer(io: SocketIOServer): void;
}

export class EventBusNotifier implements RealtimeNotifier {
  private readonly emitter = new EventEmitter();
  private io?: SocketIOServer;

  publish(event: NotificationEvent): void {
    this.emitter.emit(event.type, event);
    this.io?.emit("notification", event);
  }

  on(type: string, handler: NotificationHandler): void {
    this.emitter.on(type, handler);
  }

  attachSocketServer(io: SocketIOServer): void {
    this.io = io;
  }
}

export const defaultNotifier = new EventBusNotifier();
