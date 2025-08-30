import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { requireUserId, getOrCreateUserId } from "@/app/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await getOrCreateUserId();
  const userId = await requireUserId();
  const id = params.id;
  const body = (await req.json()) as {
    date?: string; // YYYY-MM-DD
    heightCm?: number;
    weightKg?: number;
  };

  // Ensure the measurement belongs to this user through the child
  const m = await prisma.measurement.findUnique({ where: { id } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const child = await prisma.child.findFirst({ where: { id: m.childId, userId } });
  if (!child) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: { date?: Date; heightCm?: number; weightKg?: number } = {};
  if (typeof body.heightCm === "number") data.heightCm = body.heightCm;
  if (typeof body.weightKg === "number") data.weightKg = body.weightKg;
  if (body.date) {
    const dt = new Date(body.date);
    if (Number.isNaN(dt.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.date = dt;
  }

  await prisma.measurement.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await getOrCreateUserId();
  const userId = await requireUserId();
  const id = params.id;

  // Check ownership
  const m = await prisma.measurement.findUnique({ where: { id } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const child = await prisma.child.findFirst({ where: { id: m.childId, userId } });
  if (!child) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.measurement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

