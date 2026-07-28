// Serverless function: GET /api/reviews
// Returns Coast Edge's LIVE Google reviews, pulled from the Google Business
// Profile via the Google Places API (New). Runs on Vercel (or Netlify with the
// same file under netlify/functions). The API key stays server-side — it is
// never exposed to the browser.
//
// Required environment variables (set in the hosting dashboard):
//   GOOGLE_PLACES_API_KEY  — a Google Cloud key with "Places API (New)" enabled
//   GOOGLE_PLACE_ID        — Coast Edge's Google Business Profile Place ID
//
// Notes / limits (Google's rules, not ours):
//   • The API returns up to 5 reviews (newest / most-relevant) — you can't
//     hand-pick which ones. That's plenty for the scrolling strip (we loop them).
//   • Google reviews don't include the reviewer's suburb, so each card shows a
//     relative time ("2 weeks ago") under the name instead.
//   • Review text must be shown fresh & attributed to Google (we cache briefly
//     and show the Google glyph + author name).

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Not configured yet → return empty so the site simply hides the section.
  if (!key || !placeId) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ reviews: [], configured: false });
  }

  try {
    const url = "https://places.googleapis.com/v1/places/" + encodeURIComponent(placeId);
    const resp = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
    });
    if (!resp.ok) throw new Error("Places API returned " + resp.status);
    const data = await resp.json();

    const reviews = (data.reviews || [])
      .map((rv) => ({
        quote: (rv.text && rv.text.text) || (rv.originalText && rv.originalText.text) || "",
        name: (rv.authorAttribution && rv.authorAttribution.displayName) || "Google user",
        meta: rv.relativePublishTimeDescription || "",
        rating: rv.rating || 0,
      }))
      // Only show 5-star reviews (business choice). Note: Google returns at most
      // 5 reviews total and we can't ask it for "5-star only", so if some of
      // those happen to be lower-rated, fewer than 5 cards will show.
      .filter((rv) => rv.rating === 5 && rv.quote.trim().length > 0);

    // Cache at the edge for 6h, serve stale for a day while refreshing.
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
    return res.status(200).json({
      reviews,
      rating: data.rating || null,
      total: data.userRatingCount || null,
      profileUrl: data.googleMapsUri || "",
      configured: true,
    });
  } catch (err) {
    // On any error, return empty rather than breaking the page.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ reviews: [], configured: true, error: String(err && err.message || err) });
  }
}
