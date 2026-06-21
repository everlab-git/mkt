import { Resend } from "resend";

export async function sendLoginCodeEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Resend env vars are required");
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    subject: "Seu código de acesso Freya",
    text: `Seu código de acesso é: ${code}`,
    to: email
  });
}
