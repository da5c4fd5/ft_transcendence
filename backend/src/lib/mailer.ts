import nodemailer from "nodemailer";
import { status } from "elysia";

const smtpHost = process.env.SMTP_URL;
const smtpPort = Number(process.env.SMTP_PORT ?? 1025);
const smtpEmail = process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD;

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null
  | undefined;

function getTransporter() {
  if (transporter !== undefined) {
    return transporter;
  }

  if (!smtpHost || !smtpEmail) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth:
      smtpEmail && smtpPassword
        ? {
            user: smtpEmail,
            pass: smtpPassword
          }
        : undefined
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
      from: smtpEmail,
      to: options.to,
      subject: options.subject,
      text: options.text
    });
  } catch {
    throw status(503, { message: "Failed to send confirmation email" });
  }
}
