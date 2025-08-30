import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getOrCreateUserId, requireUserId } from "@/app/lib/auth";

export async function POST(req: Request) {
  await getOrCreateUserId();
  const userId = await requireUserId();
  const body = (await req.json()) as {
    childId?: string;
    date?: string; // YYYY-MM-DD
    heightCm?: number;
    weightKg?: number;
  };
  const { childId, date, heightCm, weightKg } = body ?? {};
  if (!childId || !date || typeof heightCm !== "number" || typeof weightKg !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const child = await prisma.child.findFirst({ where: { id: childId, userId } });
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const m = await prisma.measurement.create({
    data: {
      childId,
      date: dt,
      heightCm,
      weightKg,
    },
  });
  return NextResponse.json({ id: m.id });
}

