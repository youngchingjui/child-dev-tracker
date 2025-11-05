"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Child, Measurement } from "@/app/lib/storage";
import { bmiFor } from "@/app/lib/storage";
import {
  addMeasurementApi,
  deleteMeasurementApi,
  getChildApi,
  updateMeasurementApi,
} from "@/app/lib/api";

function formatBMI(bmi: number) {
  if (!Number.isFinite(bmi) || bmi <= 0) return "–";
  return bmi.toFixed(1);
}

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [child, setChild] = useState<Child | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [date, setDate] = useState("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eDate, setEDate] = useState("");
  const [eHeight, setEHeight] = useState<string>("");
  const [eWeight, setEWeight] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const c = await getChildApi(id);
        setChild(c);
      } finally {
        setHydrated(true);
      }
    })();
  }, [id]);

  const measurements: Measurement[] = useMemo(() => {
    const list = child?.measurements ?? [];
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [child]);

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

  async function refresh() {
    const c = await getChildApi(id);
    setChild(c);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate(date, heightCm, weightKg);
    if (v) {
      setError(v);
      return;
    }
    await addMeasurementApi({
      childId: id,
      date,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    });
    setDate("");
    setHeightCm("");
    setWeightKg("");
    await refresh();
  }

  function startEdit(m: Measurement) {
    setEditingId(m.id);
    setEDate(m.date);
    setEHeight(String(m.heightCm));
    setEWeight(String(m.weightKg));
    setError(null);
  }

  async function saveEdit(idM: string) {
    const v = validate(eDate, eHeight, eWeight);
    if (v) {
      setError(v);
      return;
    }
    await updateMeasurementApi(idM, {
      date: eDate,
      heightCm: Number(eHeight),
      weightKg: Number(eWeight),
    });
    cancelEdit();
    await refresh();
  }

  function cancelEdit() {
    setEditingId(null);
    setEDate("");
    setEHeight("");
    setEWeight("");
  }

  async function removeMeasurement(idM: string) {
    if (!confirm("Delete this entry?")) return;
    await deleteMeasurementApi(idM);
    if (editingId === idM) cancelEdit();
    await refresh();
  }

  if (!hydrated) {
    return (
      <div className="font-sans min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
        <p className="text-sm text-foreground/70">Loading…</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="font-sans min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm underline"
        >
          ← Back
        </button>
        <p className="text-sm text-foreground/70">Child not found.</p>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="mb-6 text-sm underline"
      >
        ← Back
      </button>

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">{child.name}</h1>
        <p className="text-sm text-foreground/70">Born {child.birthDate}</p>
      </header>

      <section className="mb-8">
        <h2 className="font-medium mb-3">Add measurement</h2>
        <form
          onSubmit={onAdd}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
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
          <button
            type="submit"
            className="h-10 sm:h-[42px] mt-1 sm:mt-0 rounded-md px-4 bg-foreground text-background font-medium"
          >
            Add
          </button>
        </form>
        {error && (
          <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">Measurements</h2>
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
  );
}

