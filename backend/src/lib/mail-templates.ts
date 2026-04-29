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
  const port = (process.env.HTTPS_PORT ?? "8433").trim();
  return `https://${domain}:${port}`;
}

const SPROUT_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EB6383" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
  <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
  <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/>
  <path d="M5 21h14"/>
</svg>`;

function renderShell(options: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const appUrl = getAppUrl();

  const ctaRow = options.ctaLabel && options.ctaHref
    ? `<tr>
        <td style="padding:4px 36px 32px;">
          <a href="${escapeHtml(options.ctaHref)}"
             style="display:inline-block;background:#FDE856;color:#4A4A4A;text-decoration:none;font-weight:800;font-size:14px;padding:14px 28px;border-radius:999px;letter-spacing:-0.01em;">
            ${escapeHtml(options.ctaLabel)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#A0D2FF;font-family:Outfit,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#4A4A4A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#A0D2FF;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;">

            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="display:inline-block;background:#ffffff;border-radius:20px;width:56px;height:56px;box-shadow:0 4px 12px rgba(74,74,74,0.15);vertical-align:middle;line-height:0;">
                  <table role="presentation" width="56" height="56" cellspacing="0" cellpadding="0">
                    <tr><td align="center" valign="middle">${SPROUT_SVG}</td></tr>
                  </table>
                </div>
                <div style="margin-top:14px;font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#4A4A4A;">CAPSUL</div>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 4px 24px rgba(74,74,74,0.12);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                  <!-- Content -->
                  <tr>
                    <td style="padding:32px 36px 28px;">
                      <div style="font-size:22px;font-weight:900;line-height:1.15;color:#4A4A4A;">${escapeHtml(options.title)}</div>
                      <div style="margin-top:10px;font-size:15px;line-height:1.65;color:#9A9A8E;">${options.body}</div>
                    </td>
                  </tr>

                  <!-- CTA -->
                  ${ctaRow}

                  <!-- Footer -->
                  <tr>
                    <td style="padding:18px 36px 24px;border-top:1px solid rgba(74,74,74,0.07);">
                      <div style="font-size:12px;color:#9A9A8E;line-height:1.6;">
                        ${escapeHtml(options.footer ?? `Capsul · ${appUrl}`)}
                      </div>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ── Templates ───────────────────────────────────────────────────────────────

export function renderVerificationCodeMail(username: string, code: string) {
  const appUrl = getAppUrl();
  return {
    text:
      `Hello ${username},\n\n` +
      `Your email verification code: ${code}\n` +
      "Valid for 15 minutes.\n\n" +
      `Open ${appUrl}/profile`,
    html: renderShell({
      title: "Verify your email",
      body:
        `Hello ${escapeHtml(username)}! Enter this code in your profile to confirm your email address.` +
        `<div style="margin-top:20px;padding:20px 24px;border-radius:20px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.07);">` +
          `<div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9A9A8E;">Verification code</div>` +
          `<div style="margin-top:12px;font-size:38px;font-weight:900;letter-spacing:0.2em;color:#4A4A4A;font-family:ui-monospace,'Courier New',monospace;">${escapeHtml(code)}</div>` +
          `<div style="margin-top:10px;font-size:12px;color:#9A9A8E;">Valid for 15 minutes · Do not share this code</div>` +
        `</div>`,
      ctaLabel: "Open profile",
      ctaHref: `${appUrl}/profile`,
    }),
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
      title: `Welcome, ${username}.`,
      body:
        "Your timeline is ready. One honest line is enough to begin." +
        `<div style="margin-top:16px;padding:16px 20px;border-radius:16px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.07);font-size:14px;color:#4A4A4A;line-height:1.6;">` +
          "Add a moment, an image, a detail worth keeping. The best memory is the one you write today." +
        `</div>`,
      ctaLabel: "Write today's capsul",
      ctaHref: `${appUrl}/today`,
    }),
  };
}

export function renderManualReminderMail(options: {
  username: string;
  suggestions: string[];
}) {
  const appUrl = getAppUrl();

  const suggestionsHtml =
    options.suggestions.length > 0
      ? `<div style="margin-top:16px;">` +
          options.suggestions
            .map(
              (s) =>
                `<div style="margin-top:8px;padding:12px 16px;border-radius:14px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.06);font-size:14px;line-height:1.55;color:#4A4A4A;">${escapeHtml(s)}</div>`
            )
            .join("") +
        `</div>`
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
      title: "One line today?",
      body:
        `Hello ${escapeHtml(options.username)}, your timeline could use a new entry.` +
        `<div style="margin-top:16px;padding:16px 20px;border-radius:16px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.07);font-size:14px;color:#4A4A4A;line-height:1.6;">` +
          "Nothing long. Just enough to pin the day down before it slips." +
        `</div>` +
        suggestionsHtml,
      ctaLabel: "Open today",
      ctaHref: `${appUrl}/today`,
    }),
  };
}

export function renderDataExportMail(username: string, requestedAt: Date) {
  const appUrl = getAppUrl();
  const dateStr = requestedAt.toUTCString();
  return {
    text:
      `Hello ${username},\n\n` +
      `A data export of your Capsul account was requested on ${dateStr}.\n` +
      "Your export was downloaded directly from the app.\n\n" +
      `If you did not request this, contact us at ${appUrl}`,
    html: renderShell({
      title: "Your export is ready.",
      body:
        `Hello ${escapeHtml(username)}, here is a confirmation of your data export.` +
        `<div style="margin-top:20px;padding:16px 20px;border-radius:16px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.07);">` +
          `<div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9A9A8E;">Requested at</div>` +
          `<div style="margin-top:6px;font-size:14px;font-weight:700;color:#4A4A4A;">${escapeHtml(dateStr)}</div>` +
        `</div>` +
        `<div style="margin-top:12px;padding:14px 18px;border-radius:16px;background:rgba(235,99,131,0.06);border:1px solid rgba(235,99,131,0.18);font-size:13px;color:#4A4A4A;line-height:1.6;">` +
          "If you did not request this export, your account may have been accessed without your permission." +
        `</div>`,
      footer: `Capsul · ${appUrl} · Sent for GDPR traceability.`,
    }),
  };
}

export function renderAccountDeletedMail(username: string, deletedAt: Date) {
  const dateStr = deletedAt.toUTCString();
  return {
    text:
      `Hello ${username},\n\n` +
      `Your Capsul account and all related data were permanently deleted on ${dateStr}.\n` +
      "This action is irreversible.",
    html: renderShell({
      title: "Your account has been deleted.",
      body:
        `Hello ${escapeHtml(username)}, this is a confirmation that your Capsul account was permanently removed.` +
        `<div style="margin-top:20px;padding:16px 20px;border-radius:16px;background:#FFF6F0;border:1px solid rgba(74,74,74,0.07);">` +
          `<div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9A9A8E;">Deleted at</div>` +
          `<div style="margin-top:6px;font-size:14px;font-weight:700;color:#4A4A4A;">${escapeHtml(dateStr)}</div>` +
        `</div>` +
        `<div style="margin-top:12px;padding:14px 18px;border-radius:16px;background:rgba(235,99,131,0.06);border:1px solid rgba(235,99,131,0.18);font-size:13px;color:#4A4A4A;line-height:1.6;">` +
          "All your memories, sessions, friends, and related data have been permanently removed. This action cannot be undone." +
        `</div>`,
      footer: "Capsul · This email is a permanent record of your account deletion.",
    }),
  };
}
