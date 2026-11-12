import { NextResponse } from "next/server";

type Body = { name?: string; email?: string; message?: string; company?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A tiny in-memory throttle. Enough for a concept site on one instance.
const seen = new Map<string, number[]>();
const WINDOW = 60_000;
const LIMIT = 3;

function throttled(ip: string) {
  const now = Date.now();
  const hits = (seen.get(ip) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 500) seen.clear();
  return hits.length > LIMIT;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // honeypot: real people never fill a hidden field
  if (body.company) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(ip)) return NextResponse.json({ error: "too many" }, { status: 429 });

  const name = (body.name ?? "").trim().slice(0, 120);
  const email = (body.email ?? "").trim().slice(0, 200);
  const message = (body.message ?? "").trim().slice(0, 2000);
  if (!name || !EMAIL.test(email) || !message) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  const to = process.env.FITTING_TO;
  const key = process.env.RESEND_API_KEY;

  // With a key set, the request is delivered. Without one, it is still accepted
  // and logged, so the form works on a fresh clone with nothing configured.
  if (key && to) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.FITTING_FROM ?? "ALA <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `Fitting request — ${name}`,
        text: `${name} <${email}>\n\n${message}`,
      }),
    });
    if (!res.ok) {
      console.error("fitting: delivery failed", res.status, await res.text());
      return NextResponse.json({ error: "delivery" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, delivered: true });
  }

  console.info("fitting request", { name, email, message });
  return NextResponse.json({ ok: true, delivered: false });
}
