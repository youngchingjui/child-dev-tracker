"use client";

import { useEffect, useMemo, useState } from "react";
import type { Child, Measurement } from "@/app/lib/storage";
import {
  addMeasurement,
  bmiFor,
  deleteMeasurement,
  getChildren,
  saveChildren,
} from "@/app/lib/storage";

function formatBMI(bmi: number) {
  if (!Number.isFinite(bmi) || bmi <= 0) return "–";
  return bmi.toFixed(1);
}

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state (per active child)
  const [date, setDate] = useState("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");

  // Edit state (per active child)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eDate, setEDate] = useState("");
  const [eHeight, setEHeight] = useState<string>("");
  const [eWeight, setEWeight] = useState<string>("");

  useEffect(() => {
    const list = getChildren();
    setChildren(list);
    setActiveId((prev) => prev ?? (list[0]?.id ?? null));
    setHydrated(true);
  }, []);

  const activeChild: Child | undefined = useMemo(
    () => children.find((c) => c.id === activeId),
    [children, activeId]
  );

  const measurements: Measurement[] = useMemo(() => {
    const list = activeChild?.measurements ?? [];
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [activeChild]);

  function refresh() {
    const list = getChildren();
    setChildren(list);
  }

  function validate(d: string, hStr: string, wStr: string) {
    if (!d) return "Date is required";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "Invalid date";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dt > today) return "Date cannot be in the future";

    const h = Number(hStr);
    const w = Number(wStr);
    if (!Number.isFinite(h) || h <= 0) return "Height must be a positive number";
    if (!Number.isFinite(w) || w <= 0) return "Weight must be a positive number";
    if (h < 20 || h > 250) return "Height seems unrealistic (20–250 cm)";
    if (w < 1 || w > 300) return "Weight seems unrealistic (1–300 kg)";
    return null;
  }

  function resetForms() {
    setDate("");
    setHeightCm("");
    setWeightKg("");
    setEditingId(null);
    setEDate("");
    setEHeight("");
    setEWeight("");
    setError(null);
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setError(null);
    const v = validate(date, heightCm, weightKg);
    if (v) {
      setError(v);
      return;
    }
    addMeasurement(activeId, {
      date,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    });
    setDate("");
    setHeightCm("");
    setWeightKg("");
    refresh();
  }

  function startEdit(m: Measurement) {
    setEditingId(m.id);
    setEDate(m.date);
    setEHeight(String(m.heightCm));
    setEWeight(String(m.weightKg));
    setError(null);
  }

  function saveEdit(idM: string) {
    if (!activeId) return;
    const v = validate(eDate, eHeight, eWeight);
    if (v) {
      setError(v);
      return;
    }
    // perform in place update for the active child
    const all = getChildren();
    const idx = all.findIndex((c) => c.id === activeId);
    if (idx === -1) return;
    const list = all[idx].measurements ?? [];
    const mIdx = list.findIndex((x) => x.id === idM);
    if (mIdx === -1) return;
    const next = [...list];
    next[mIdx] = {
      ...next[mIdx],
      date: eDate,
      heightCm: Number(eHeight),
      weightKg: Number(eWeight),
    };
    all[idx] = { ...all[idx], measurements: next };
    saveChildren(all);
    resetForms();
    refresh();
  }

  function cancelEdit() {
    setEditingId(null);
    setEDate("");
    setEHeight("");
    setEWeight("");
  }

  function removeMeasurement(idM: string) {
    if (!activeId) return;
    if (!confirm("Delete this entry?")) return;
    deleteMeasurement(activeId, idM);
    if (editingId === idM) cancelEdit();
    refresh();
  }

  function onSelectChild(id: string) {
    setActiveId(id);
    resetForms();
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Child Growth Tracker</h1>
        <p className="text-sm text-foreground/70 mt-1">
          Select a child tab to add height, weight, and BMI entries. Data is saved in your browser.
        </p>
      </header>

      {!hydrated ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : children.length === 0 ? (
        <p className="text-sm text-foreground/70">No children added yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Tabs */}
          <div role="tablist" aria-label="Children" className="flex flex-wrap gap-2">
            {children.map((c) => {
              const selected = c.id === activeId;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onSelectChild(c.id)}
                  className={
                    "h-9 px-3 rounded-md text-sm font-medium border " +
                    (selected
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent border-black/10 dark:border-white/20")
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Active child content */}
          {activeChild && (
            <div className="mt-2">
              <header className="mb-4">
                <h2 className="text-xl font-medium">{activeChild.name}</h2>
                <p className="text-sm text-foreground/70">Born {activeChild.birthDate}</p>
              </header>

              <section className="mb-6">
                <h3 className="font-medium mb-3">Add measurement</h3>
                <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="date" className="text-sm">Date</label>
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="height" className="text-sm">Height (cm)</label>
                    <input
                      id="height"
                      inputMode="decimal"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="e.g. 110"
                      className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="weight" className="text-sm">Weight (kg)</label>
                    <input
                      id="weight"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="e.g. 18.5"
                      className="h-10 rounded-md px-3 border border-black/10 dark:border-white/20 bg-transparent"
                    />
                  </div>
                  <button type="submit" className="h-10 sm:h-[42px] mt-1 sm:mt-0 rounded-md px-4 bg-foreground text-background font-medium">
                    Add
                  </button>
                </form>
                {error && (
                  <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </section>

              <section>
                <h3 className="font-medium mb-3">Measurements</h3>
                {measurements.length === 0 ? (
                  <p className="text-sm text-foreground/70">No measurements yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-md border-black/10 dark:border-white/10 overflow-hidden">
                      <thead className="bg-black/5 dark:bg-white/5">
                        <tr>
                          <th className="text-left p-3">Date</th>
                          <th className="text-left p-3">Height (cm)</th>
                          <th className="text-left p-3">Weight (kg)</th>
                          <th className="text-left p-3">BMI</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10 dark:divide-white/10">
                        {measurements.map((m) => (
                          <tr key={m.id} className="align-middle">
                            {editingId === m.id ? (
                              <>
                                <td className="p-2">
                                  <input
                                    type="date"
                                    value={eDate}
                                    onChange={(e) => setEDate(e.target.value)}
                                    className="h-9 w-full rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    inputMode="decimal"
                                    value={eHeight}
                                    onChange={(e) => setEHeight(e.target.value)}
                                    className="h-9 w-full rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    inputMode="decimal"
                                    value={eWeight}
                                    onChange={(e) => setEWeight(e.target.value)}
                                    className="h-9 w-full rounded-md px-2 border border-black/10 dark:border-white/20 bg-transparent"
                                  />
                                </td>
                                <td className="p-2">{formatBMI(bmiFor({ heightCm: Number(eHeight), weightKg: Number(eWeight) }))}</td>
                                <td className="p-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => saveEdit(m.id)}
                                      className="h-9 px-3 rounded-md bg-foreground text-background"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 whitespace-nowrap">{m.date}</td>
                                <td className="p-3">{m.heightCm}</td>
                                <td className="p-3">{m.weightKg}</td>
                                <td className="p-3">{formatBMI(bmiFor(m))}</td>
                                <td className="p-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEdit(m)}
                                      className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => removeMeasurement(m.id)}
                                      className="h-9 px-3 rounded-md border border-red-600 text-red-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

