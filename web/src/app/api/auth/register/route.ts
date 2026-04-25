import { NextResponse } from "next/server";
import { registerUser } from "@/auth";
import { rateLimit } from "@/server/rate-limit";
import { clientIPFromRequest } from "@/server/request-meta";
import { scoped } from "@/server/logger";
import { registerSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

const log = scoped("register");

export async function POST(req: Request) {
  const ip = clientIPFromRequest(req);
  const rl = await rateLimit(`register:${ip}`, 5, 60 * 60_000, { failClosed: true });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

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
