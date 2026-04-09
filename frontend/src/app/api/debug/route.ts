import { auth } from "@/auth";
import { cookies } from "next/headers";
import { prisma } from "@/backend/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;

  const cookieStore = await cookies();
  const activeBizCookie = cookieStore.get("pumai_active_business")?.value;

  let bizData = null;
  if (activeBizCookie) {
    bizData = await prisma.business.findUnique({
      where: { id: activeBizCookie },
      select: { id: true, name: true, _count: { select: { conversations: true, agents: true } } },
    });
  }

  return Response.json({
    userId: user?.id ?? null,
    role: user?.role ?? null,
    activeBusinessId: user?.activeBusinessId ?? null,
    cookie_pumai_active_business: activeBizCookie ?? null,
    businessFromCookie: bizData,
    allCookies: cookieStore.getAll().map(c => c.name),
  });
}
