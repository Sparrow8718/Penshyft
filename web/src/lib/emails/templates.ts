const BRAND = "Penshyft";
const PRIMARY = "#2563eb";
const GRAY = "#6b7280";

function layout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="padding:24px 28px 0;font-size:14px;font-weight:600;color:${PRIMARY}">${BRAND}</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:14px;line-height:1.6;color:#1f2937">
${content}
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:11px;color:${GRAY};text-align:center">
Sent by ${BRAND}. Do not reply to this email.
</p>
</td></tr>
</table>
</body></html>`;
}

function button(label: string, url: string, color = PRIMARY) {
  return `<a href="${url}" style="display:inline-block;padding:10px 24px;background:${color};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;margin:8px 4px 8px 0">${label}</a>`;
}

export function shiftOfferEmail(args: {
  staffName: string;
  shiftLabel: string;
  siteName: string;
  offerUrl: string;
}) {
  return layout(`
<p style="margin:0 0 12px">Hi ${args.staffName},</p>
<p style="margin:0 0 12px">A shift is available for you:</p>
<div style="background:#f9fafb;border-radius:6px;padding:12px 16px;margin:0 0 16px">
  <strong>${args.shiftLabel}</strong><br>
  <span style="color:${GRAY}">Site: ${args.siteName}</span>
</div>
<p style="margin:0 0 16px">
  ${button("Accept", args.offerUrl)}
  ${button("View details", args.offerUrl, GRAY)}
</p>
<p style="margin:0;color:${GRAY};font-size:12px">This link is unique to you. Do not share it.</p>
`);
}

export function teamInviteEmail(args: {
  inviteeName: string;
  orgName: string;
  inviterName: string;
  acceptUrl: string;
  role: string;
}) {
  return layout(`
<p style="margin:0 0 12px">Hi${args.inviteeName ? ` ${args.inviteeName}` : ""},</p>
<p style="margin:0 0 12px">${args.inviterName} has invited you to join <strong>${args.orgName}</strong> on ${BRAND} as <strong>${args.role}</strong>.</p>
<p style="margin:0 0 16px">
  ${button("Accept invite", args.acceptUrl)}
</p>
<p style="margin:0;color:${GRAY};font-size:12px">If you didn't expect this invitation, you can ignore this email.</p>
`);
}

export function swapRequestedEmail(args: {
  staffName: string;
  shiftLabel: string;
  reason: string;
  approvalUrl: string;
}) {
  return layout(`
<p style="margin:0 0 12px">A swap request needs your attention:</p>
<div style="background:#f9fafb;border-radius:6px;padding:12px 16px;margin:0 0 12px">
  <strong>${args.staffName}</strong> wants to swap:<br>
  <span style="color:${GRAY}">${args.shiftLabel}</span>
</div>
${args.reason ? `<p style="margin:0 0 12px"><em>Reason: ${args.reason}</em></p>` : ""}
<p style="margin:0 0 16px">
  ${button("Review", args.approvalUrl)}
</p>
`);
}

export function swapResolvedEmail(args: {
  staffName: string;
  shiftLabel: string;
  approved: boolean;
  managerNote?: string;
}) {
  const status = args.approved ? "approved" : "denied";
  const color = args.approved ? "#16a34a" : "#dc2626";
  return layout(`
<p style="margin:0 0 12px">Hi ${args.staffName},</p>
<p style="margin:0 0 12px">Your swap request has been <strong style="color:${color}">${status}</strong>.</p>
<div style="background:#f9fafb;border-radius:6px;padding:12px 16px;margin:0 0 12px">
  <span style="color:${GRAY}">${args.shiftLabel}</span>
</div>
${args.managerNote ? `<p style="margin:0 0 12px"><em>Note: ${args.managerNote}</em></p>` : ""}
`);
}
