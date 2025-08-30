"use client";

import { useEffect, useMemo, useState } from "react";

// Types
export type Measurement = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  heightCm: number; // centimeters
  weightKg: number; // kilograms
  note?: string;
};

export type Child = {
  id: string;
  name: string;
  birthDate: string; // ISO date string YYYY-MM-DD
  measurements?: Measurement[]; // optional for backward-compat with older saved data
};

const STORAGE_KEY = "children";

function uid() {
  const uuid =
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : null;
  return uuid ?? `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function bmi(kg: number, cm: number) {
  const m = cm / 100;
  if (!m || !kg) return 0;
  return kg / (m * m);
}

function fmt(n: number, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  // child form state
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingBirthDate, setEditingBirthDate] = useState("");

  // measurement form state (for adding)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [mDate, setMDate] = useState("");
  const [mHeight, setMHeight] = useState<string>("");
  const [mWeight, setMWeight] = useState<string>("");
  const [mNote, setMNote] = useState<string>("");

  // measurement editing state (single active edit to keep UI simple)
  const [editingMeasId, setEditingMeasId] = useState<string | null>(null);
  const [editMDate, setEditMDate] = useState("");
  const [editMHeight, setEditMHeight] = useState<string>("");
  const [editMWeight, setEditMWeight] = useState<string>("");
  const [editMNote, setEditMNote] = useState<string>("");

  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Child[];
        if (Array.isArray(parsed)) {
          // Backward compatibility: ensure measurements array exists
          const migrated = parsed.map((c) => ({
            ...c,
            measurements: Array.isArray(c.measurements) ? c.measurements : [],
          }));
          setChildren(migrated);
        }
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage when children changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
    } catch {
      // ignore
    }
  }, [children, hydrated]);

  const sortedChildren = useMemo(() => {
    return [...children].sort((a, b) => a.name.localeCompare(b.name));
  }, [children]);

  // Child helpers
  function resetChildForm() {
    setName("");
    setBirthDate("");
    setError(null);
  }

  function validateChild(n: string, bd: string) {
    if (!n.trim()) return "Name is required";
    if (!bd) return "Birth date is required";
    const d = new Date(bd);
    if (Number.isNaN(d.getTime())) return "Birth date is invalid";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d > today) return "Birth date cannot be in the future";
    return null;
  }

  function addChild(e: React.FormEvent) {
    e.preventDefault();
    const v = validateChild(name, birthDate);
    if (v) {
      setError(v);
      return;
    }
    const newChild: Child = { id: uid(), name: name.trim(), birthDate, measurements: [] };
    setChildren((prev) => [...prev, newChild]);
    resetChildForm();
  }

  function startEditChild(c: Child) {
    setEditingChildId(c.id);
    setEditingName(c.name);
    setEditingBirthDate(c.birthDate);
    setError(null);
  }

  function saveEditChild(id: string) {
    const v = validateChild(editingName, editingBirthDate);
    if (v) {
      setError(v);
      return;
    }
    setChildren((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: editingName.trim(), birthDate: editingBirthDate } : c
      )
    );
    cancelEditChild();
  }

  function cancelEditChild() {
    setEditingChildId(null);
    setEditingName("");
    setEditingBirthDate("");
    setError(null);
  }

  function removeChild(id: string) {
    const c = children.find((x) => x.id === id);
    const label = c ? `${c.name} (${c.birthDate})` : "this child";
    if (confirm(`Delete ${label}?`)) {
      setChildren((prev) => prev.filter((c) => c.id !== id));
      if (editingChildId === id) cancelEditChild();
      if (editingMeasId) cancelEditMeasurement();
      const next = new Set(expanded);
      next.delete(id);
      setExpanded(next);
    }
  }

  // Measurement helpers
  function validateMeasurement(date: string, height: string, weight: string) {
    if (!date) return "Date is required";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "Date is invalid";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d > today) return "Date cannot be in the future";

    const h = Number(height);
    const w = Number(weight);
    if (!Number.isFinite(h) || h <= 0) return "Height must be a positive number";
    if (!Number.isFinite(w) || w <= 0) return "Weight must be a positive number";
    if (h < 30 || h > 250) return "Height should be between 30cm and 250cm";
    if (w < 1 || w > 300) return "Weight should be between 1kg and 300kg";
    return null;
  }

  function resetMeasurementForm() {
    setMDate("");
    setMHeight("");
    setMWeight("");
    setMNote("");
    setFormError(null);
  }

  function addMeasurement(childId: string, e: React.FormEvent) {
    e.preventDefault();
    const v = validateMeasurement(mDate, mHeight, mWeight);
    if (v) return setFormError(v);
    const nu: Measurement = {
      id: uid(),
      date: mDate,
      heightCm: Number(mHeight),
      weightKg: Number(mWeight),
      note: mNote?.trim() || undefined,
    };
    setChildren((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, measurements: [...(c.measurements ?? []), nu] } : c))
    );
    resetMeasurementForm();
  }

  function startEditMeasurement(childId: string, m: Measurement) {
    setEditingMeasId(`${childId}::${m.id}`);
    setEditMDate(m.date);
    setEditMHeight(String(m.heightCm));
    setEditMWeight(String(m.weightKg));
    setEditMNote(m.note ?? "");
    setFormError(null);
  }

  function cancelEditMeasurement() {
    setEditingMeasId(null);
    setEditMDate("");
    setEditMHeight("");
    setEditMWeight("");
    setEditMNote("");
    setFormError(null);
  }

  function saveEditMeasurement(childId: string, measId: string) {
    const v = validateMeasurement(editMDate, editMHeight, editMWeight);
    if (v) return setFormError(v);
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        const next = (c.measurements ?? []).map((m) =>
          m.id === measId
            ? {
                ...m,
                date: editMDate,
                heightCm: Number(editMHeight),
                weightKg: Number(editMWeight),
                note: editMNote?.trim() || undefined,
              }
            : m
        );
        return { ...c, measurements: next };
      })
    );
    cancelEditMeasurement();
  }

  function removeMeasurement(childId: string, measId: string) {
    if (!confirm("Delete this measurement?")) return;
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        const next = (c.measurements ?? []).filter((m) => m.id !== measId);
        return { ...c, measurements: next };
      })
    );
    if (editingMeasId === `${childId}::${measId}`) cancelEditMeasurement();
  }

  function toggleExpanded(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold">Child Growth Tracker</h1>
        <p className="text-sm text-foreground/70 mt-1">
          Track your children&rsquo;s height, weight, and BMI over time. Data is saved locally in your browser.
        </p>
      </header>

      {/* Add child */}
      <section className="mb-8">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 sm:p-5">
          <h2 className="font-medium mb-3">Add a child</h2>
          <form
            onSubmit={addChild}
            className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm">Name</label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                placeholder="Jane Doe"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="birthDate" className="text-sm">Birth date</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
              />
            </div>

            <button
              type="submit"
              className="h-10 sm:h-[42px] mt-1 sm:mt-0 rounded-md px-4 bg-foreground text-background font-medium"
            >
              Add child
            </button>
          </form>
          {error && (
            <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </section>

      {/* Children list */}
      <section>
        {!hydrated ? (
          <p className="text-sm text-foreground/70">Loading…</p>
        ) : sortedChildren.length === 0 ? (
          <p className="text-sm text-foreground/70">No children added yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {sortedChildren.map((c) => {
              const meas = (c.measurements ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
              const latest = meas[0];
              const isEditing = editingChildId === c.id;
              const isOpen = expanded.has(c.id);
              return (
                <li key={c.id} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 justify-between">
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                            placeholder="Name"
                            autoFocus
                          />
                          <input
                            type="date"
                            value={editingBirthDate}
                            onChange={(e) => setEditingBirthDate(e.target.value)}
                            className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <span>{c.name}</span>
                            {latest ? (
                              <span className="text-xs rounded-full border px-2 py-0.5 border-black/10 dark:border-white/20 text-foreground/80">
                                Latest: {latest.heightCm}cm • {latest.weightKg}kg • BMI {fmt(bmi(latest.weightKg, latest.heightCm))}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-foreground/70">Born {c.birthDate}</div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditChild(c.id)}
                              className="h-9 px-3 rounded-md bg-foreground text-background text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditChild}
                              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleExpanded(c.id)}
                              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 text-sm"
                            >
                              {isOpen ? "Hide growth" : "Manage growth"}
                            </button>
                            <button
                              onClick={() => startEditChild(c)}
                              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeChild(c.id)}
                              className="h-9 px-3 rounded-md border border-red-600 text-red-600 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded: measurements */}
                    {isOpen && (
                      <div className="border-t pt-4 border-black/10 dark:border-white/10">
                        <h3 className="font-medium mb-3">Measurements</h3>
                        <form
                          onSubmit={(e) => addMeasurement(c.id, e)}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3 items-end mb-3"
                        >
                          <div className="flex flex-col gap-1">
                            <label className="text-sm" htmlFor={`date_${c.id}`}>Date</label>
                            <input
                              id={`date_${c.id}`}
                              type="date"
                              value={mDate}
                              onChange={(e) => setMDate(e.target.value)}
                              className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm" htmlFor={`height_${c.id}`}>Height (cm)</label>
                            <input
                              id={`height_${c.id}`}
                              inputMode="decimal"
                              placeholder="e.g. 110"
                              value={mHeight}
                              onChange={(e) => setMHeight(e.target.value)}
                              className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm" htmlFor={`weight_${c.id}`}>Weight (kg)</label>
                            <input
                              id={`weight_${c.id}`}
                              inputMode="decimal"
                              placeholder="e.g. 18.4"
                              value={mWeight}
                              onChange={(e) => setMWeight(e.target.value)}
                              className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm" htmlFor={`note_${c.id}`}>Notes</label>
                            <input
                              id={`note_${c.id}`}
                              placeholder="optional"
                              value={mNote}
                              onChange={(e) => setMNote(e.target.value)}
                              className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                            />
                          </div>
                          <button
                            type="submit"
                            className="h-10 rounded-md px-4 bg-foreground text-background font-medium"
                          >
                            Add
                          </button>
                        </form>
                        {formError && (
                          <p role="alert" className="text-red-600 text-sm mb-3">{formError}</p>
                        )}

                        {(c.measurements ?? []).length === 0 ? (
                          <p className="text-sm text-foreground/70">No measurements yet.</p>
                        ) : (
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-full text-sm">
                              <thead className="text-left">
                                <tr className="text-foreground/70">
                                  <th className="py-2 px-4">Date</th>
                                  <th className="py-2 px-4">Height</th>
                                  <th className="py-2 px-4">Weight</th>
                                  <th className="py-2 px-4">BMI</th>
                                  <th className="py-2 px-4">Notes</th>
                                  <th className="py-2 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                {meas.map((m) => {
                                  const active = editingMeasId === `${c.id}::${m.id}`;
                                  return (
                                    <tr key={m.id}>
                                      <td className="py-2 px-4 align-middle">
                                        {active ? (
                                          <input
                                            type="date"
                                            value={editMDate}
                                            onChange={(e) => setEditMDate(e.target.value)}
                                            className="h-9 rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent"
                                          />
                                        ) : (
                                          <span>{m.date}</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-4 align-middle">
                                        {active ? (
                                          <input
                                            inputMode="decimal"
                                            value={editMHeight}
                                            onChange={(e) => setEditMHeight(e.target.value)}
                                            className="h-9 rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent w-28"
                                          />
                                        ) : (
                                          <span>{m.heightCm} cm</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-4 align-middle">
                                        {active ? (
                                          <input
                                            inputMode="decimal"
                                            value={editMWeight}
                                            onChange={(e) => setEditMWeight(e.target.value)}
                                            className="h-9 rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent w-28"
                                          />
                                        ) : (
                                          <span>{m.weightKg} kg</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-4 align-middle">
                                        <span className="tabular-nums">{fmt(bmi(m.weightKg, m.heightCm))}</span>
                                      </td>
                                      <td className="py-2 px-4 align-middle">
                                        {active ? (
                                          <input
                                            value={editMNote}
                                            onChange={(e) => setEditMNote(e.target.value)}
                                            className="h-9 rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent w-44"
                                          />
                                        ) : (
                                          <span className="text-foreground/80">{m.note ?? ""}</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-4 align-middle text-right whitespace-nowrap">
                                        {active ? (
                                          <div className="flex gap-2 justify-end">
                                            <button
                                              onClick={() => saveEditMeasurement(c.id, m.id)}
                                              className="h-9 px-3 rounded-md bg-foreground text-background text-xs font-medium"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={cancelEditMeasurement}
                                              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 text-xs"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2 justify-end">
                                            <button
                                              onClick={() => startEditMeasurement(c.id, m)}
                                              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 text-xs"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => removeMeasurement(c.id, m.id)}
                                              className="h-9 px-3 rounded-md border border-red-600 text-red-600 text-xs"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

