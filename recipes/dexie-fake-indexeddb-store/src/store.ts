import "fake-indexeddb/auto";
import { Dexie, type Table } from "dexie";

export interface Item {
  id?: number;
  sku: string;
  category: string;
  price: number;
  createdAt: number;
}

export class StoreDB extends Dexie {
  items!: Table<Item, number>;

  constructor(name = "provenpin-store") {
    super(name);
    this.version(1).stores({
      items: "++id, sku, category, price, createdAt, [category+price]",
    });
  }
}

export function createStore(name?: string): StoreDB {
  return new StoreDB(name);
}
