export type Measurement = {
  id: string;
  date: string; // YYYY-MM-DD
  heightCm: number;
  weightKg: number;
};

export type Child = {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  // Optional to be backward-compatible with early saved data
  measurements?: Measurement[];
};

const STORAGE_KEY = "children";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function uid() {
  const uuid =
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : null;
  return uuid ?? `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getChildren(): Child[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Child[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => ({ ...c, measurements: c.measurements ?? [] }));
  } catch {
    return [];
  }
}

export function saveChildren(children: Child[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
  } catch {
    // ignore
  }
}

export function getChild(id: string): Child | undefined {
  return getChildren().find((c) => c.id === id);
}

export function upsertChild(child: Child) {
  const children = getChildren();
  const idx = children.findIndex((c) => c.id === child.id);
  if (idx === -1) {
    children.push({ ...child, measurements: child.measurements ?? [] });
  } else {
    children[idx] = { ...child, measurements: child.measurements ?? [] };
  }
  saveChildren(children);
}

export function deleteChild(id: string) {
  const children = getChildren().filter((c) => c.id !== id);
  saveChildren(children);
}

export function addMeasurement(childId: string, m: Omit<Measurement, "id">) {
  const children = getChildren();
  const idx = children.findIndex((c) => c.id === childId);
  if (idx === -1) return;
  const id = uid();
  const next: Measurement = { id, ...m };
  const current = children[idx].measurements ?? [];
  children[idx] = {
    ...children[idx],
    measurements: [...current, next],
  };
  saveChildren(children);
}

export function updateMeasurement(
  childId: string,
  measurementId: string,
  patch: Partial<Omit<Measurement, "id">>
) {
  const children = getChildren();
  const idx = children.findIndex((c) => c.id === childId);
  if (idx === -1) return;
  const list = children[idx].measurements ?? [];
  const mIdx = list.findIndex((m) => m.id === measurementId);
  if (mIdx === -1) return;
  const updated: Measurement = { ...list[mIdx], ...patch, id: measurementId };
  const next = [...list];
  next[mIdx] = updated;
  children[idx] = { ...children[idx], measurements: next };
  saveChildren(children);
}

export function deleteMeasurement(childId: string, measurementId: string) {
  const children = getChildren();
  const idx = children.findIndex((c) => c.id === childId);
  if (idx === -1) return;
  const list = children[idx].measurements ?? [];
  children[idx] = {
    ...children[idx],
    measurements: list.filter((m) => m.id !== measurementId),
  };
  saveChildren(children);
}

export function bmiFor(m: { heightCm: number; weightKg: number }): number {
  const h = m.heightCm / 100;
  if (!h) return 0;
  return m.weightKg / (h * h);
}

