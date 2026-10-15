import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { z } from "zod";

const ItemSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  qty: z.coerce.number(),
});

const CatalogSchema = z.object({
  catalog: z.object({
    item: z.array(ItemSchema).min(1),
  }),
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => name === "item",
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

export function parseCatalog(xml: string) {
  const raw = parser.parse(xml);
  return CatalogSchema.parse(raw).catalog.item;
}

export function buildCatalog(items: z.infer<typeof ItemSchema>[]) {
  return builder.build({ catalog: { item: items } });
}
