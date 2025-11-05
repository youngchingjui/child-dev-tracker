import type { Child } from "@/app/lib/storage";

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function getChildrenApi(): Promise<Child[]> {
  return json<Child[]>("/api/children", { cache: "no-store" });
}

export function getChildApi(id: string): Promise<Child> {
  return json<Child>(`/api/children/${id}`, { cache: "no-store" });
}

export async function addMeasurementApi(params: {
  childId: string;
  date: string; // YYYY-MM-DD
  heightCm: number;
  weightKg: number;
}): Promise<void> {
  await json(`/api/measurements`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updateMeasurementApi(id: string, patch: {
  date?: string;
  heightCm?: number;
  weightKg?: number;
}): Promise<void> {
  await json(`/api/measurements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteMeasurementApi(id: string): Promise<void> {
  await json(`/api/measurements/${id}`, {
    method: "DELETE",
  });
}

