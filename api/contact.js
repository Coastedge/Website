// Serverless function: POST /api/contact
// Sends the quote-form enquiry FROM the Coast Edge domain via Resend
// (https://resend.com) — reliable transactional email, no Google app password
// needed. Also sends the customer an automatic "we've got it" reply when they
// leave an email. Runs on Vercel/Netlify. Zero npm dependencies (uses fetch).
//
// Required environment variables (set in the hosting dashboard):
//   RESEND_API_KEY  — API key from resend.com (after verifying coastedge.com.au)
//   CONTACT_TO      — (optional) where enquiries land; default admin@coastedge.com.au
//   CONTACT_FROM    — (optional) verified sender; default below. MUST be on the
//                     verified domain (e.g. noreply@coastedge.com.au).

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
  const from = process.env.CONTACT_FROM || "Coast Edge Electrical <noreply@coastedge.com.au>";
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

    // 2) Auto-reply → customer (only when they left an email)
    if (email) {
      await sendEmail({
        from: from,
        to: [email],
        subject: "Thanks — we've got your enquiry",
        html:
          '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0c1c3d;line-height:1.5">' +
          "<p>Hi " + esc(name) + ",</p>" +
          "<p>Thanks for getting in touch with Coast Edge Electrical — we've received your enquiry" +
          (service ? " about <strong>" + esc(service) + "</strong>" : "") +
          " and will get back to you shortly.</p>" +
          '<p>If it\'s urgent, call us on <a href="tel:0458858881">0458 858 881</a>.</p>' +
          "<p>Cheers,<br>Coast Edge Electrical<br>Joshua Aldous, Director</p>" +
          "</div>",
        text:
          "Hi " + name + ",\n\nThanks for getting in touch with Coast Edge Electrical — we've " +
          "received your enquiry and will get back to you shortly. If it's urgent, call 0458 858 881.\n\n" +
          "Cheers,\nCoast Edge Electrical",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String((err && err.message) || err) });
  }
}
