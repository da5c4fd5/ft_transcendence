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

  if (!port || port === 443) {
    return `https://${domain}`;
  }

  return `https://${domain}:${port}`;
}

function renderShell(options: {
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const appUrl = getAppUrl();

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#FFF6F0;font-family:Outfit,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#4A4A4A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF6F0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:32px;overflow:hidden;border:1px solid rgba(74,74,74,0.08);box-shadow:0 18px 40px rgba(74,74,74,0.08);">
            <tr>
              <td style="padding:0 0 18px;background:linear-gradient(180deg,#FFF6F0 0%,#FFF6F0 100%);">
                <div style="padding:18px 24px 0;">
                  <div style="height:14px;">
                    <span style="display:inline-block;width:14px;height:14px;border-radius:999px;background:#FDE856;margin-right:8px;"></span>
                    <span style="display:inline-block;width:14px;height:14px;border-radius:999px;background:#A0D2FF;margin-right:8px;"></span>
                    <span style="display:inline-block;width:14px;height:14px;border-radius:999px;background:#EB6383;"></span>
                  </div>
                </div>
                <div style="margin:18px 20px 0;padding:26px 28px;border-radius:28px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.06);">
                  <div style="font-size:11px;line-height:1.4;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#9A9A8E;">${escapeHtml(
                    options.eyebrow
                  )}</div>
                  <div style="margin-top:10px;font-size:32px;line-height:1.05;font-weight:900;color:#4A4A4A;">${escapeHtml(
                    options.title
                  )}</div>
                  <div style="margin-top:12px;font-size:16px;line-height:1.55;color:#4A4A4A;">${escapeHtml(
                    options.intro
                  )}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 6px;">
                ${options.bodyHtml}
              </td>
            </tr>
            ${
              options.ctaLabel && options.ctaHref
                ? `<tr>
              <td style="padding:10px 28px 8px;">
                <a href="${escapeHtml(
                  options.ctaHref
                )}" style="display:inline-block;background:#FDE856;color:#4A4A4A;text-decoration:none;font-weight:800;font-size:14px;padding:14px 22px;border-radius:999px;">${escapeHtml(
                  options.ctaLabel
                )}</a>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:18px 28px 28px;">
                <div style="font-size:12px;line-height:1.6;color:#9A9A8E;">
                  ${escapeHtml(options.footer ?? `Capsul · ${appUrl}`)}
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
      `Use this code to verify your email: ${code}\n` +
      "Valid for 15 minutes.\n\n" +
      `Open ${appUrl}/profile`,
    html: renderShell({
      eyebrow: "Email Verification",
      title: "Verify your email",
      intro: `Hello ${username}, use this code in your profile.`,
      bodyHtml: `
        <div style="padding:22px 24px;border-radius:26px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.06);">
          <div style="font-size:12px;line-height:1.5;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#9A9A8E;">Verification code</div>
          <div style="margin-top:12px;font-size:36px;line-height:1;font-weight:900;letter-spacing:0.28em;color:#4A4A4A;">${escapeHtml(
            code
          )}</div>
          <div style="margin-top:12px;font-size:14px;line-height:1.6;color:#4A4A4A;">Valid for 15 minutes.</div>
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
      "Write one memory today and let the timeline begin.\n\n" +
      `${appUrl}/today`,
    html: renderShell({
      eyebrow: "Welcome",
      title: "Welcome to Capsul",
      intro: `Hello ${username}, your timeline is ready.`,
      bodyHtml: `
        <div style="padding:18px 20px;border-radius:24px;background:#A0D2FF1A;border:1px solid rgba(160,210,255,0.35);font-size:15px;line-height:1.65;color:#4A4A4A;">
          One honest line is enough. Add a moment, an image, a detail worth keeping.
        </div>
      `,
      ctaLabel: "Write today's capsul",
      ctaHref: `${appUrl}/today`
    })
  };
}

export function renderManualReminderMail(options: {
  username: string;
  suggestions: string[];
}) {
  const appUrl = getAppUrl();
  const suggestionsHtml =
    options.suggestions.length > 0
      ? `<div style="margin-top:18px;padding:18px 20px;border-radius:24px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.06);">
          <div style="font-size:12px;line-height:1.5;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#9A9A8E;">Start here</div>
          <ul style="margin:12px 0 0;padding:0;list-style:none;">
            ${options.suggestions
              .map(
                (suggestion) =>
                  `<li style="margin-top:10px;padding:12px 14px;border-radius:18px;background:#ffffff;border:1px solid rgba(74,74,74,0.05);font-size:14px;line-height:1.55;color:#4A4A4A;">${escapeHtml(
                    suggestion
                  )}</li>`
              )
              .join("")}
          </ul>
        </div>`
      : "";

  const suggestionLines =
    options.suggestions.length > 0
      ? `\n\nA few ideas:\n- ${options.suggestions.join("\n- ")}`
      : "";

  return {
    text:
      `Hello ${options.username},\n\n` +
      "Your timeline could use one more line today." +
      suggestionLines +
      `\n\n${appUrl}/today`,
    html: renderShell({
      eyebrow: "Daily Nudge",
      title: "Your timeline wants a new entry",
      intro: `Hello ${options.username}, drop one line in Capsul today.`,
      bodyHtml: `
        <div style="padding:18px 20px;border-radius:24px;background:#EB638314;border:1px solid rgba(235,99,131,0.24);font-size:15px;line-height:1.65;color:#4A4A4A;">
          Nothing long. Just enough to pin the day down before it slips.
        </div>
        ${suggestionsHtml}
      `,
      ctaLabel: "Open today",
      ctaHref: `${appUrl}/today`
    })
  };
}
