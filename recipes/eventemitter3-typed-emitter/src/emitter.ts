import EventEmitter from "eventemitter3";

export type AppEvents = {
  "user:created": [payload: { id: string; email: string }];
  "order:paid": [payload: { orderId: string; total: number }];
  error: [error: Error];
};

export type TypedEventEmitter = EventEmitter<AppEvents>;

export function createEmitter(): TypedEventEmitter {
  return new EventEmitter<AppEvents>();
}
