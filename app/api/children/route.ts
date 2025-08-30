import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getOrCreateUserId, requireUserId } from "@/app/lib/auth";

function formatDate(d: Date): string {
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export async function GET() {
  // Ensure user exists and is identified via cookie
  await getOrCreateUserId();
  const userId = await requireUserId();

  const children = await prisma.child.findMany({
    where: { userId },
    include: { measurements: true },
    orderBy: { createdAt: "asc" },
  });

  const json = children.map((c) => ({
    id: c.id,
    name: c.name,
    birthDate: formatDate(c.birthDate),
    measurements: c.measurements
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((m) => ({
        id: m.id,
        date: formatDate(m.date),
        heightCm: m.heightCm,
        weightKg: m.weightKg,
      })),
  }));

  return NextResponse.json(json);
}

export async function POST(req: Request) {
  await getOrCreateUserId();
  const userId = await requireUserId();
  const body = (await req.json()) as {
    name?: string;
    birthDate?: string; // YYYY-MM-DD
  };
  if (!body?.name || !body?.birthDate) {
    return NextResponse.json({ error: "Missing name or birthDate" }, { status: 400 });
  }
  const birth = new Date(body.birthDate);
  if (Number.isNaN(birth.getTime())) {
    return NextResponse.json({ error: "Invalid birthDate" }, { status: 400 });
  }
  const child = await prisma.child.create({
    data: {
      name: body.name,
      birthDate: birth,
      userId,
    },
  });
  return NextResponse.json({
    id: child.id,
    name: child.name,
    birthDate: formatDate(child.birthDate),
    measurements: [],
  });
}

