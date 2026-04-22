import { NextResponse } from "next/server";
import { registerUser } from "@/auth";
import { rateLimit } from "@/backend/rate-limit";

export const dynamic = "force-dynamic";

function clientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  const ip = clientIP(req);
  const rl = await rateLimit(`register:${ip}`, 5, 60 * 60_000, { failClosed: true });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const { name, email, password, consent } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "You must accept the Terms and Privacy Policy" }, { status: 400 });
    }

    try {
      await registerUser(name, email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // Do not leak whether the email exists — return a generic success
      if (message === "Email already registered") {
        return NextResponse.json({ ok: true }, { status: 201 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register] error", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }
}
