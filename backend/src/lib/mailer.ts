import nodemailer from "nodemailer";
import { status } from "elysia";

const smtpUrl = process.env.SMTP_URL?.trim();
const smtpEmail = process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD;

function resolveSmtpConfig() {
  if (!smtpUrl) return null;

  if (!smtpUrl.includes("://")) {
    return {
      host: smtpUrl,
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: Number(process.env.SMTP_PORT ?? 1025) === 465,
      authUser: smtpEmail,
      authPass: smtpPassword
    };
  }

  const parsed = new URL(smtpUrl);
  const port = parsed.port
    ? Number(parsed.port)
    : Number(process.env.SMTP_PORT ?? (parsed.protocol === "smtps:" ? 465 : 1025));

  return {
    host: parsed.hostname,
    port,
    secure: parsed.protocol === "smtps:" || port === 465,
    authUser: (smtpEmail ?? parsed.username) || undefined,
    authPass: (smtpPassword ?? parsed.password) || undefined
  };
}

export function isMailConfigured() {
  return !!smtpUrl && !!smtpEmail;
}

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null
  | undefined;

function getTransporter() {
  if (transporter !== undefined) {
    return transporter;
  }

  if (!isMailConfigured()) {
    transporter = null;
    return transporter;
  }

  const smtp = resolveSmtpConfig();
  if (!smtp) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.authUser && smtp.authPass
        ? {
            user: smtp.authUser,
            pass: smtp.authPass
          }
        : undefined
  });

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
      text: options.text,
      html: options.html
    });
  } catch {
    throw status(503, { message: "Failed to send email" });
  }
}
