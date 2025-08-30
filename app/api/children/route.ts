import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const children = await prisma.child.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        measurements: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });
    return NextResponse.json(children);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, dateOfBirth, gender } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const child = await prisma.child.create({
      data: {
        name,
        gender: gender ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });
    return NextResponse.json(child, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create child" }, { status: 500 });
  }
}

