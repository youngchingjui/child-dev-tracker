import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const measurements = await prisma.measurement.findMany({
      where: { childId: params.id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(measurements);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch measurements" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { date, heightCm, weightKg, headCircumferenceCm, note } = body ?? {};
    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    const m = await prisma.measurement.create({
      data: {
        childId: params.id,
        date: new Date(date),
        heightCm: heightCm != null ? Number(heightCm) : null,
        weightKg: weightKg != null ? Number(weightKg) : null,
        headCircumferenceCm: headCircumferenceCm != null ? Number(headCircumferenceCm) : null,
        note: note ?? null,
      },
    });
    return NextResponse.json(m, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create measurement" }, { status: 500 });
  }
}

