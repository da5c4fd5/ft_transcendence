import nodemailer from "nodemailer";
import { status } from "elysia";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 1025);
const smtpFrom = process.env.SMTP_FROM ?? "no-reply@capsul.local";

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null
  | undefined;

function getTransporter() {
  if (transporter !== undefined) {
    return transporter;
  }

  if (!smtpHost) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false
  });

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
}) {
  const transport = getTransporter();
  if (!transport) {
    throw status(503, { message: "Email delivery is not configured" });
  }

  try {
    await transport.sendMail({
      from: smtpFrom,
      to: options.to,
      subject: options.subject,
      text: options.text
    });
  } catch {
    throw status(503, { message: "Failed to send confirmation email" });
  }
}
