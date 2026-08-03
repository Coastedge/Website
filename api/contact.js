// Serverless function: POST /api/contact
// Emails the quote-form enquiry to the business inbox via Resend
// (https://resend.com). Internal notification only — no customer-facing reply,
// so a verified domain is nice-to-have, not required. reply_to is the customer's
// email so Josh can reply straight back. Zero npm dependencies (uses fetch).
//
// Environment variables (set in the Vercel dashboard):
//   RESEND_API_KEY  — required. API key from resend.com.
//   CONTACT_TO      — where enquiries land. Default admin@coastedge.com.au.
//   CONTACT_FROM    — the sender. Default "Coast Edge Electrical <onboarding@resend.dev>"
//                     which works WITHOUT verifying a domain (but can only send to
//                     the Resend account's own email, so CONTACT_TO must match the
//                     signup email). Once coastedge.com.au is verified in Resend,
//                     set this to e.g. "Coast Edge <noreply@coastedge.com.au>".

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&]/g, function (c) {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO || "admin@coastedge.com.au";
  const from = process.env.CONTACT_FROM || "Coast Edge Electrical <onboarding@resend.dev>";
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "Email not configured yet" });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Honeypot — real people never fill the hidden "company" field.
  if (body.company) return res.status(200).json({ ok: true });

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const suburb = String(body.suburb || "").trim();
  const service = String(body.service || "").trim();
  const message = String(body.message || "").trim();

  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: "Name and phone are required" });
  }

  const rows = [
    ["Name", name], ["Phone", phone], ["Email", email || "—"],
    ["Suburb", suburb || "—"], ["Service", service || "—"],
  ].map(function (kv) {
    return '<tr><td style="padding:4px 14px 4px 0;color:#56637d">' + kv[0] +
      '</td><td style="padding:4px 0;font-weight:600;color:#0c1c3d">' + esc(kv[1]) + "</td></tr>";
  }).join("");

  const adminHtml =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0c1c3d">' +
    '<h2 style="margin:0 0 12px">New quote request</h2>' +
    '<table style="border-collapse:collapse">' + rows + "</table>" +
    '<p style="margin:16px 0 4px;color:#56637d">Details</p>' +
    '<p style="margin:0;white-space:pre-wrap">' + esc(message || "—") + "</p>" +
    "</div>";

  const adminText =
    "New quote request\nName: " + name + "\nPhone: " + phone + "\nEmail: " + (email || "-") +
    "\nSuburb: " + (suburb || "-") + "\nService: " + (service || "-") +
    "\n\nDetails:\n" + (message || "-") + "\n";

  async function sendEmail(payload) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Resend " + r.status + ": " + (await r.text()));
    return r.json();
  }

  try {
    // 1) Enquiry → Coast Edge inbox (replies go straight to the customer if given)
    await sendEmail({
      from: from,
      to: [to],
      reply_to: email || undefined,
      subject: "Quote request — " + (service || "General") + " — " + name,
      html: adminHtml,
      text: adminText,
    });

    // No customer auto-reply — enquiries go to the business inbox only. Josh
    // can hit reply (reply_to is the customer's email) to respond directly.

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String((err && err.message) || err) });
  }
}
