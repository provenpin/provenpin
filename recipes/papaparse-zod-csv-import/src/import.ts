import Papa from "papaparse";
import { z } from "zod";

const Row = z.object({
  email: z.email(),
  name: z.string().min(1),
  seats: z.coerce.number().int().min(1),
  active: z.enum(["yes", "no"]).transform((v) => v === "yes"),
});
export type Customer = z.infer<typeof Row>;

export function importCustomers(csv: string) {
  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
    transform: (v) => v.trim(),
  });
  const ok: Customer[] = [];
  const errors: { row: number; message: string }[] = parsed.errors.map((e) => ({ row: (e.row ?? 0) + 2, message: e.message }));
  parsed.data.forEach((raw, i) => {
    const r = Row.safeParse(raw);
    if (r.success) ok.push(r.data);
    else errors.push({ row: i + 2, message: r.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") }); // +2: header + 1-based
  });
  return { ok, errors };
}

export const exportCustomers = (rows: Customer[]) => Papa.unparse(rows.map((r) => ({ ...r, active: r.active ? "yes" : "no" })), { quotes: true });
