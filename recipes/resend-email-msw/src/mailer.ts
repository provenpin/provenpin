import { Resend } from "resend";

export async function sendWelcome(resend: Resend, to: string, name: string) {
  const safe = name.replace(/[<>&"]/g, "");
  const { data, error } = await resend.emails.send({
    from: "App <hello@example.com>",
    to: [to],
    subject: `Welcome, ${safe}!`,
    html: `<h1>Welcome, ${safe}</h1><p>Thanks for signing up.</p>`,
    text: `Welcome, ${safe}. Thanks for signing up.`,
    tags: [{ name: "category", value: "welcome" }],
  });
  if (error) throw new Error(`resend: ${error.message}`); // the SDK returns errors instead of throwing
  return data!.id;
}
