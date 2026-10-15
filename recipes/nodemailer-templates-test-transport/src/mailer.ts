import nodemailer, { type Transporter } from "nodemailer";

// prod: nodemailer.createTransport({ host, port: 587, secure: false, auth: { user, pass } })
export const testTransport = () => nodemailer.createTransport({ jsonTransport: true });

export async function sendInvoice(t: Transporter, to: string, invoiceNo: string, pdf: Buffer) {
  const info = await t.sendMail({
    from: '"Billing" <billing@example.com>',
    to,
    subject: `Invoice ${invoiceNo}`,
    text: `Your invoice ${invoiceNo} is attached.`,
    html: `<p>Your invoice <b>${invoiceNo}</b> is attached.</p>`,
    attachments: [{ filename: `${invoiceNo}.pdf`, content: pdf, contentType: "application/pdf" }],
    headers: { "X-Invoice": invoiceNo },
  });
  return info;
}
