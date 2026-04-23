import { NextResponse } from "next/server";
import { registerUser } from "@/auth";
import { rateLimit } from "@/server/rate-limit";
import { clientIPFromRequest } from "@/server/request-meta";
import { scoped } from "@/server/logger";

export const dynamic = "force-dynamic";

const log = scoped("register");

export async function POST(req: Request) {
  const ip = clientIPFromRequest(req);
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
    log.error({ err }, "failed");
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }
}
