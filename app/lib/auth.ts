import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "userId";

export async function getOrCreateUserId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  // Create a new user and set cookie
  const user = await prisma.user.create({ data: {} });
  cookieStore.set({
    name: COOKIE_NAME,
    value: user.id,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
  });
  return user.id;
}

export async function requireUserId(): Promise<string> {
  const cookieStore = await cookies();
  const id = cookieStore.get(COOKIE_NAME)?.value;
  if (id) return id;
  // if no user, create one
  return getOrCreateUserId();
}

