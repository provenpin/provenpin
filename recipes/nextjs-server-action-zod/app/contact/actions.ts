"use server";
import { z } from "zod";

const Contact = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  message: z.string().trim().min(10, "At least 10 characters").max(2000),
  newsletter: z.stringbool().default(false), // checkboxes send "on" or nothing
});

export type ContactState =
  | { ok: true; id: string }
  | { ok: false; errors: Partial<Record<keyof z.infer<typeof Contact>, string[]>>; values?: Record<string, string> };

export const sent: z.infer<typeof Contact>[] = []; // replace with your DB / email call

// Signature matches useActionState(action, initialState): (prevState, formData)
export async function submitContact(_prev: ContactState | null, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = Contact.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, values: raw };
  sent.push(parsed.data);
  return { ok: true, id: `msg_${sent.length}` };
}
