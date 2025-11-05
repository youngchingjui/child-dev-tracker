import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { requireUserId, getOrCreateUserId } from "@/app/lib/auth";

function formatDate(d: Date): string {
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await getOrCreateUserId();
  const userId = await requireUserId();
  const id = params.id;

  const child = await prisma.child.findFirst({
    where: { id, userId },
    include: { measurements: true },
  });
  if (!child) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: child.id,
    name: child.name,
    birthDate: formatDate(child.birthDate),
    measurements: child.measurements
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((m) => ({ id: m.id, date: formatDate(m.date), heightCm: m.heightCm, weightKg: m.weightKg })),
  });
}

