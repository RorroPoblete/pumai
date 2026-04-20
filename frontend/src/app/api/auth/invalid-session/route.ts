import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

function publicBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3002";
}

export async function GET() {
  await signOut({ redirect: false });
  return NextResponse.redirect(`${publicBase()}/login?error=session_expired`);
}
