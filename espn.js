// Vercel Serverless Function — fetches the ESPN World Cup feed on the server
// (no browser CORS involved) and returns it to your page from the same origin.
// Lives at /api/espn. Your site calls it as: /api/espn?dates=20260611-20260622
//
// No setup, no keys. Just deploy this file alongside index.html on Vercel.

export default async function handler(req, res) {
  // Only allow the date param through, digits and a hyphen — nothing else.
  const dates = String(req.query.dates || "").replace(/[^0-9-]/g, "");
  if (!dates) {
    res.status(400).json({ error: "Missing or invalid 'dates' (use YYYYMMDD or YYYYMMDD-YYYYMMDD)." });
    return;
  }

  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard" +
    "?dates=" + dates + "&limit=400";

  try {
    const upstream = await fetch(url, { headers: { "User-Agent": "worldcup-sweep" } });
    if (!upstream.ok) {
      res.status(502).json({ error: "Upstream feed returned " + upstream.status });
      return;
    }
    const data = await upstream.json();

    // Same-origin response, plus a short edge cache so refreshes are cheap.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Could not reach the upstream feed." });
  }
}
