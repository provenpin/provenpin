import { fail, redirect, type Actions } from "@sveltejs/kit";
import { z } from "zod";

const Signup = z.object({ email: z.email(), password: z.string().min(8) });
export const users: string[] = [];

export const actions = {
  default: async ({ request, cookies }) => {
    const form = Object.fromEntries(await request.formData()) as Record<string, string>;
    const parsed = Signup.safeParse(form);
    if (!parsed.success) {
      // never echo the password back to the page
      return fail(400, { email: form.email, errors: z.flattenError(parsed.error).fieldErrors });
    }
    if (users.includes(parsed.data.email)) return fail(409, { email: form.email, errors: { email: ["Already registered"] } });
    users.push(parsed.data.email);
    cookies.set("session", `s_${users.length}`, { path: "/", httpOnly: true, sameSite: "lax" });
    redirect(303, "/welcome");
  },
} satisfies Actions;
