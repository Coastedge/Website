# Coast Edge Electrical — landing page

A single-page marketing/lead-gen site for **Coast Edge Electrical** (Sunshine Coast, QLD).
Built as a **self-contained static site** — plain HTML, CSS and vanilla JS, no build step and
no framework. Host it anywhere (Netlify, Vercel, Cloudflare Pages, cPanel, S3, or a plain web host).

## Files

```
coast-edge-electrical/
├── index.html          all markup + inline SVG icon sprite (no icon CDN)
├── styles.css          Coast Edge blue light theme, responsive, reduced-motion aware
├── script.js           reviews marquee, services, card→form prefill, form validation/submit
└── assets/
    └── coast-edge-logo.png
```

## Run it locally

It's just static files. Any of these work:

```bash
npx serve coast-edge-electrical
```

…or open `index.html` directly in a browser (note: opening via `file://` still works, but use a
local server if you want the form's `fetch` path to behave exactly as in production).

## Deploy

Upload the folder's contents to any static host. Nothing to compile.

---

## ⚠️ Before you go live — do these

These are content/wiring items only the owner can supply. Everything is clearly marked in the code.

1. **Google reviews — now automatic (live from Google).** The site pulls real reviews straight
   from Coast Edge's Google Business Profile via `api/reviews.js` and shows **only 5-star** ones.
   The placeholder sample cards in `script.js` (`placeholderReviews`) now render **only on
   localhost** for design preview — the public site shows real reviews, or nothing if none are
   available. It never shows the samples.

   To switch it on, set two environment variables in the hosting dashboard (Vercel/Netlify):
   - `GOOGLE_PLACES_API_KEY` — a Google Cloud key with **Places API (New)** enabled
   - `GOOGLE_PLACE_ID` — Coast Edge's Google Business Profile **Place ID**

   Get the Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
   Enable the API + make a key: https://console.cloud.google.com (APIs & Services → Enable "Places
   API (New)" → Credentials → create key; restrict it to the Places API). Cost is effectively $0 at
   this traffic (Google's free monthly credit covers it), but the key does require a billing card.

   **Limitations (Google's, not ours):** the API returns at most **5 reviews** (newest / most
   relevant) and you can't hand-pick them; filtering to 5-star can leave fewer than 5. Google
   reviews carry no suburb, so each card shows a relative time ("2 weeks ago") under the name.
   Requires a host that runs serverless functions (Vercel/Netlify) — a plain file host can't do the
   live version. `api/reviews.js` is Vercel-style; for Netlify move it to `netlify/functions/`.

2. **Hero photo — in place, but it's a stock image.** `assets/hero.jpg` is a licensed stock photo
   (an electrician working a switchboard). It reads well, but it isn't Coast Edge and the worker's
   helmet carries an unrelated name/label. Swap in a real photo of Josh / the branded van when you
   have one — just replace `assets/hero.jpg` (keep the subject on the **right**; the left is covered
   by the scrim). No code change needed.

3. **Wire the contact form to a real inbox.** Out of the box the form works with **no backend**:
   on submit it opens the visitor's email app pre-filled to `admin@coastedge.com.au` (mailto
   fallback). For a proper hosted form, set `FORM_ENDPOINT` at the top of `script.js` to a
   Formspree / Basin / serverless endpoint (it POSTs JSON `{name, phone, suburb, service, message}`)
   — the code already handles loading, success and error states.

4. **Footer details.** Add the real **licence number / ABN** if it should appear (footer in
   `index.html`).

5. **Logo.** Using the PNG cropped from the business card. If a vector (SVG) original exists, swap
   it in for crisper display.

---

## Notes for whoever maintains it

- **Announcement bar** (top strip) toggles via `SHOW_ANNOUNCEMENT_BAR` at the top of `script.js`.
- **Services** and **reviews** are data-driven — edit the `services` / `reviews` arrays in
  `script.js`; the markup regenerates automatically. Each service card, when clicked (or
  activated with Enter/Space), smooth-scrolls to the form and preselects itself in
  "What do you need?".
- **Icons** are an inline SVG sprite in `index.html` (Lucide-style) — no external icon library,
  so nothing breaks if a CDN is down. The Google glyph is the real 4-colour "G".
- **Accessibility:** service cards are keyboard-activatable; focus shows the accent ring; the
  duplicated marquee clones are hidden from screen readers; the marquee stops for users who prefer
  reduced motion.
- **Design tokens** (colours, radius, shadow) live as CSS variables in `:root` at the top of
  `styles.css`.

Design & copy recreated from the supplied Nocturne design handoff.
