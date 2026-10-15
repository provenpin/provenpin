import { z } from "zod";

export const Address = z
  .object({ street: z.string().min(1), city: z.string(), zip: z.string().regex(/^\d{5}$/) })
  .meta({ id: "Address", description: "Postal address" });

export const Customer = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().min(1).max(80),
  tier: z.enum(["free", "pro"]).default("free"),
  tags: z.array(z.string()).max(5).optional(),
  address: Address,
});

export type Customer = z.infer<typeof Customer>;

/** JSON Schema of what a client may send (defaults make fields optional). */
export function customerInputSchema() {
  return z.toJSONSchema(Customer, { target: "draft-2020-12", io: "input" });
}

/** JSON Schema of what the API returns after parsing (defaults applied, so required). */
export function customerOutputSchema() {
  return z.toJSONSchema(Customer, { target: "draft-2020-12", io: "output" });
}
