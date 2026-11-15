// Adds a waitlist signup to the right Flodesk segment.
// Needs FLODESK_API_KEY, FLODESK_SEGMENT_GROUP, FLODESK_SEGMENT_COURSE in Netlify env vars.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { first = "", email = "", list = "", company = "" } = await req.json().catch(() => ({}));
  if (company) return Response.json({ ok: true }); // hidden spam trap field was filled

  const segment = { group: process.env.FLODESK_SEGMENT_GROUP, course: process.env.FLODESK_SEGMENT_COURSE }[list];
  const cleanEmail = String(email).trim().toLowerCase();
  if (!segment || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return Response.json({ ok: false, error: "Please check your email and try again." }, { status: 400 });
  }

  const res = await fetch("https://api.flodesk.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(process.env.FLODESK_API_KEY + ":").toString("base64"),
      "Content-Type": "application/json",
      "User-Agent": "Boss Lady Bloggers website (bossladybloggers.com)",
    },
    body: JSON.stringify({
      email: cleanEmail,
      first_name: String(first).trim().slice(0, 60),
      segment_ids: [segment],
    }),
  });

  if (!res.ok) {
    console.error("Flodesk error", res.status, await res.text());
    return Response.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
};
