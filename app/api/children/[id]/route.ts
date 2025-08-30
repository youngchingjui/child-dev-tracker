import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        measurements: {
          orderBy: { date: "desc" },
        },
      },
    });
    if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(child);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch child" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, dateOfBirth, gender } = body ?? {};
    const child = await prisma.child.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
      },
    });
    return NextResponse.json(child);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update child" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cascade delete of measurements handled by Prisma relation
    await prisma.child.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete child" }, { status: 500 });
  }
}

