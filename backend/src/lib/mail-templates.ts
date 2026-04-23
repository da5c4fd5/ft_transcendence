function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppUrl() {
  const domain = process.env.DOMAIN?.trim() || "transcen.dence.fr";
  const port = Number(process.env.HTTPS_PORT ?? 443);
  const protocol = "https";

  if (!port || port === 443) {
    return `${protocol}://${domain}`;
  }

  return `${protocol}://${domain}:${port}`;
}

function renderLayout(options: {
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const appUrl = getAppUrl();
  const footer =
    options.footer ??
    "Privacy-friendly by design: no tracking pixels, no hidden analytics, just the message itself.";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#fff8f1;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2b2b2b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff8f1;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #f1e3d0;">
            <tr>
              <td style="padding:28px 32px 20px;background:linear-gradient(135deg,#ffe58f 0%,#ffd36a 100%);">
                <div style="font-size:11px;line-height:1.4;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#7a5b00;">${escapeHtml(
                  options.eyebrow
                )}</div>
                <div style="margin-top:10px;font-size:30px;line-height:1.1;font-weight:900;color:#2b2b2b;">${escapeHtml(
                  options.title
                )}</div>
                <div style="margin-top:12px;font-size:15px;line-height:1.6;color:#4a4a4a;">${escapeHtml(
                  options.intro
                )}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;">
                ${options.bodyHtml}
              </td>
            </tr>
            ${
              options.ctaLabel && options.ctaHref
                ? `<tr>
              <td style="padding:8px 32px 8px;">
                <a href="${escapeHtml(
                  options.ctaHref
                )}" style="display:inline-block;background:#ffcf4d;color:#2b2b2b;text-decoration:none;font-weight:800;font-size:14px;padding:14px 22px;border-radius:999px;">${escapeHtml(
                  options.ctaLabel
                )}</a>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:20px 32px 30px;">
                <div style="font-size:12px;line-height:1.6;color:#7a7a7a;">
                  ${escapeHtml(footer)}
                </div>
                <div style="margin-top:10px;font-size:12px;line-height:1.6;color:#7a7a7a;">
                  Capsul · <a href="${escapeHtml(
                    appUrl
                  )}" style="color:#2b2b2b;">${escapeHtml(appUrl)}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderVerificationCodeMail(username: string, code: string) {
  const appUrl = getAppUrl();
  return {
    text:
      `Hello ${username},\n\n` +
      `Your Capsul verification code is ${code}.\n` +
      "It expires in 15 minutes.\n\n" +
      `Open ${appUrl}/profile to confirm your email.`,
    html: renderLayout({
      eyebrow: "Email Verification",
      title: "Confirm your email",
      intro: `Hello ${username}, here is your 6-digit Capsul verification code.`,
      bodyHtml: `
        <div style="margin-bottom:18px;font-size:15px;line-height:1.6;color:#4a4a4a;">
          Enter this code in your profile page. It expires in 15 minutes.
        </div>
        <div style="display:inline-block;padding:18px 22px;border-radius:22px;background:#fff8e1;border:1px solid #f4d786;font-size:34px;line-height:1;font-weight:900;letter-spacing:0.28em;color:#2b2b2b;">
          ${escapeHtml(code)}
        </div>
      `,
      ctaLabel: "Open profile",
      ctaHref: `${appUrl}/profile`
    })
  };
}

export function renderWelcomeMail(username: string) {
  const appUrl = getAppUrl();
  return {
    text:
      `Hello ${username},\n\n` +
      "Welcome to Capsul.\n" +
      "Write one short memory each day and watch your timeline grow.\n\n" +
      `Start here: ${appUrl}/today`,
    html: renderLayout({
      eyebrow: "Welcome",
      title: "Welcome to Capsul",
      intro:
        `Hello ${username}, your space is ready. One short memory a day is enough to start building your timeline.`,
      bodyHtml: `
        <div style="font-size:15px;line-height:1.7;color:#4a4a4a;">
          Keep it simple: one honest line, one image, one moment worth keeping.
        </div>
        <div style="margin-top:16px;padding:16px 18px;border-radius:22px;background:#fff4f8;border:1px solid #f7d6e3;font-size:14px;line-height:1.7;color:#4a4a4a;">
          No tracking gimmicks. No engagement traps. Just your memories, your pace, your archive.
        </div>
      `,
      ctaLabel: "Write today's capsul",
      ctaHref: `${appUrl}/today`
    })
  };
}

export function renderInactivityReminderMail(username: string, missedDays: number) {
  const appUrl = getAppUrl();
  const line =
    missedDays <= 1
      ? "Your daily capsul is still waiting for you."
      : `You have missed ${missedDays} daily capsuls in a row.`;

  return {
    text:
      `Hello ${username},\n\n` +
      `${line}\n` +
      "Write one short memory today to keep your timeline alive.\n\n" +
      `Go to ${appUrl}/today`,
    html: renderLayout({
      eyebrow: "Daily Reminder",
      title: "Your timeline misses you",
      intro: `Hello ${username}, ${line.toLowerCase()}`,
      bodyHtml: `
        <div style="font-size:15px;line-height:1.7;color:#4a4a4a;">
          No guilt, no spying, no weird tracking pixel. Just a friendly nudge to drop one sentence in today's capsul.
        </div>
        <div style="margin-top:16px;padding:16px 18px;border-radius:22px;background:#fff3ef;border:1px solid #f4d0c4;font-size:14px;line-height:1.7;color:#4a4a4a;">
          Even one line counts. Keep the streak alive before the memories blur together.
        </div>
      `,
      ctaLabel: "Write today's capsul",
      ctaHref: `${appUrl}/today`
    })
  };
}
