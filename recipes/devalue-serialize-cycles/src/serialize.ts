import { parse, stringify } from "devalue";

export type GraphNode = {
  id: string;
  createdAt: Date;
  scores: Map<string, number>;
  parent?: GraphNode;
  peer?: GraphNode;
};

export function serialize(value: unknown): string {
  return stringify(value);
}

export function deserialize<T>(value: string): T {
  return parse(value) as T;
}

export function roundTrip<T>(value: T): T {
  return deserialize<T>(serialize(value));
}

export function buildGraph(): GraphNode {
  const root: GraphNode = {
    id: "root",
    createdAt: new Date("2024-01-02T03:04:05.678Z"),
    scores: new Map([["a", 1]]),
  };
  root.parent = root;

  const peer: GraphNode = {
    id: "peer",
    createdAt: new Date("2024-02-03T00:00:00.000Z"),
    scores: new Map([["b", 2]]),
    parent: root,
  };
  peer.peer = peer;

  root.peer = peer;
  return root;
}
