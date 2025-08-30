import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { date, heightCm, weightKg, headCircumferenceCm, note } = body ?? {};
    const m = await prisma.measurement.update({
      where: { id: params.id },
      data: {
        ...(date !== undefined ? { date: new Date(date) } : {}),
        ...(heightCm !== undefined ? { heightCm: heightCm != null ? Number(heightCm) : null } : {}),
        ...(weightKg !== undefined ? { weightKg: weightKg != null ? Number(weightKg) : null } : {}),
        ...(headCircumferenceCm !== undefined ? { headCircumferenceCm: headCircumferenceCm != null ? Number(headCircumferenceCm) : null } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });
    return NextResponse.json(m);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update measurement" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.measurement.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete measurement" }, { status: 500 });
  }
}

