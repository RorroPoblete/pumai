import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await signOut({ redirect: false });
  const url = new URL("/login", req.url);
  url.searchParams.set("error", "session_expired");
  return NextResponse.redirect(url);
}
