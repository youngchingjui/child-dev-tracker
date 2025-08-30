"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { computeBMI, formatDateISO } from "@/lib/growth";
import { useParams } from "next/navigation";

type Measurement = {
  id: string;
  date: string;
  heightCm: number | null;
  weightKg: number | null;
  headCircumferenceCm: number | null;
  note?: string | null;
};

type Child = {
  id: string;
  name: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  measurements: Measurement[];
};

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingChild, setEditingChild] = useState(false);
  const [childForm, setChildForm] = useState({ name: "", gender: "", dateOfBirth: "" });

  const [mForm, setMForm] = useState({ date: "", heightCm: "", weightKg: "", headCircumferenceCm: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/children/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load");
        if (!isMounted) return;
        setChild(data);
        setChildForm({
          name: data.name ?? "",
          gender: data.gender ?? "",
          dateOfBirth: data.dateOfBirth ? formatDateISO(data.dateOfBirth) : "",
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load";
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function reload() {
    try {
      const res = await fetch(`/api/children/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setChild(data);
      setChildForm({
        name: data.name ?? "",
        gender: data.gender ?? "",
        dateOfBirth: data.dateOfBirth ? formatDateISO(data.dateOfBirth) : "",
      });
    } catch {
      // ignore for now
    }
  }

  async function saveChild() {
    setSaving(true);
    try {
      const res = await fetch(`/api/children/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: childForm.name.trim(),
          gender: childForm.gender || null,
          dateOfBirth: childForm.dateOfBirth || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setEditingChild(false);
      await reload();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function addMeasurement() {
    setSaving(true);
    try {
      const payload = {
        date: mForm.date,
        heightCm: mForm.heightCm ? parseFloat(mForm.heightCm) : null,
        weightKg: mForm.weightKg ? parseFloat(mForm.weightKg) : null,
        headCircumferenceCm: mForm.headCircumferenceCm ? parseFloat(mForm.headCircumferenceCm) : null,
        note: mForm.note || null,
      };
      const res = await fetch(`/api/children/${id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add measurement");
      setMForm({ date: "", heightCm: "", weightKg: "", headCircumferenceCm: "", note: "" });
      await reload();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to add measurement";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeasurement(mid: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/measurements/${mid}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await reload();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      alert(message);
    }
  }

  const last = child?.measurements?.[0];
  const bmi = computeBMI(last?.weightKg ?? null, last?.heightCm ?? null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-zinc-950 dark:to-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-10 backdrop-blur border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">← Back</Link>
          <div className="text-xl font-semibold">{child?.name || "Child"}</div>
          <div className="ml-auto flex items-center gap-2">
            {!editingChild ? (
              <button onClick={() => setEditingChild(true)} className="px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">Edit</button>
            ) : (
              <>
                <button onClick={() => setEditingChild(false)} className="px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">Cancel</button>
                <button disabled={saving} onClick={saveChild} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="py-16 text-center text-zinc-500">Loading…</div>
        ) : error ? (
          <div className="py-16 text-center text-red-500">{error}</div>
        ) : !child ? (
          <div className="py-16 text-center text-zinc-500">Child not found</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 p-4">
              {!editingChild ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-zinc-500">Name</div>
                    <div className="font-medium">{child.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Gender</div>
                    <div className="font-medium">{child.gender || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Date of birth</div>
                    <div className="font-medium">{child.dateOfBirth ? formatDateISO(child.dateOfBirth) : "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Latest BMI</div>
                    <div className="font-medium">{bmi ?? "—"}</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</label>
                    <input value={childForm.name} onChange={(e) => setChildForm({ ...childForm, name: e.target.value })} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Gender</label>
                    <select value={childForm.gender} onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
                      <option value="">—</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Date of birth</label>
                    <input type="date" value={childForm.dateOfBirth} onChange={(e) => setChildForm({ ...childForm, dateOfBirth: e.target.value })} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2" />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold mb-3">Add Measurement</h3>
              <div className="grid sm:grid-cols-5 gap-3">
                <input type="date" value={mForm.date} onChange={(e) => setMForm({ ...mForm, date: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2" />
                <input inputMode="decimal" placeholder="Height (cm)" value={mForm.heightCm} onChange={(e) => setMForm({ ...mForm, heightCm: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2" />
                <input inputMode="decimal" placeholder="Weight (kg)" value={mForm.weightKg} onChange={(e) => setMForm({ ...mForm, weightKg: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2" />
                <input inputMode="decimal" placeholder="Head (cm)" value={mForm.headCircumferenceCm} onChange={(e) => setMForm({ ...mForm, headCircumferenceCm: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2" />
                <input placeholder="Note" value={mForm.note} onChange={(e) => setMForm({ ...mForm, note: e.target.value })} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 sm:col-span-2" />
                <div className="sm:col-span-3 flex justify-end">
                  <button disabled={!mForm.date || saving} onClick={addMeasurement} className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50">{saving ? "Saving…" : "Add"}</button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold mb-3">History</h3>
              {child.measurements.length === 0 ? (
                <div className="text-zinc-500">No measurements yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Height (cm)</th>
                        <th className="py-2 pr-4">Weight (kg)</th>
                        <th className="py-2 pr-4">BMI</th>
                        <th className="py-2 pr-4">Head (cm)</th>
                        <th className="py-2 pr-4">Note</th>
                        <th className="py-2 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {child.measurements.map((m) => (
                        <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                          <td className="py-2 pr-4">{formatDateISO(m.date)}</td>
                          <td className="py-2 pr-4">{m.heightCm ?? "—"}</td>
                          <td className="py-2 pr-4">{m.weightKg ?? "—"}</td>
                          <td className="py-2 pr-4">{computeBMI(m.weightKg, m.heightCm) ?? "—"}</td>
                          <td className="py-2 pr-4">{m.headCircumferenceCm ?? "—"}</td>
                          <td className="py-2 pr-4 max-w-[24ch] truncate">{m.note || ""}</td>
                          <td className="py-2 pr-4 text-right">
                            <button onClick={() => deleteMeasurement(m.id)} className="px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

