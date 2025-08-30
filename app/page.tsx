"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeBMI, formatDateISO, computeAgeYears } from "@/lib/growth";

type Child = {
  id: string;
  name: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
  measurements: Array<{
    id: string;
    date: string;
    heightCm: number | null;
    weightKg: number | null;
  }>;
};

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", gender: "", dateOfBirth: "" });
  const [saving, setSaving] = useState(false);

  async function loadChildren() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/children", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setChildren(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChildren();
  }, []);

  async function createChild() {
    setSaving(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          gender: form.gender || null,
          dateOfBirth: form.dateOfBirth || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create child");
      setIsOpen(false);
      setForm({ name: "", gender: "", dateOfBirth: "" });
      await loadChildren();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create child";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteChild(id: string) {
    if (!confirm("Delete this child and all measurements?")) return;
    try {
      const res = await fetch(`/api/children/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadChildren();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      alert(message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-zinc-950 dark:to-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-10 backdrop-blur border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Child Growth Tracker</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition"
          >
            <span className="text-lg">＋</span>
            <span>Add Child</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading…</div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">{error}</div>
        ) : children.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">No children added yet.</p>
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-lg px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition"
            >
              Add your first child
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((c) => {
              const last = c.measurements[0];
              const bmi = computeBMI(last?.weightKg ?? null, last?.heightCm ?? null);
              const age = computeAgeYears(c.dateOfBirth);
              return (
                <div key={c.id} className="group rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold truncate">{c.name}</h2>
                      <p className="text-sm text-zinc-500">
                        {age != null ? `${age} yrs` : "DOB not set"}
                        {c.gender ? ` • ${c.gender}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <Link href={`/children/${c.id}`} className="px-2 py-1.5 text-sm rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">Open</Link>
                      <button onClick={() => deleteChild(c.id)} className="px-2 py-1.5 text-sm rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50">Delete</button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3">
                      <div className="text-xs text-zinc-500">Height</div>
                      <div className="text-base font-medium">{last?.heightCm ?? "—"} cm</div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3">
                      <div className="text-xs text-zinc-500">Weight</div>
                      <div className="text-base font-medium">{last?.weightKg ?? "—"} kg</div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3">
                      <div className="text-xs text-zinc-500">BMI</div>
                      <div className="text-base font-medium">{bmi ?? "—"}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-zinc-500">
                    {last ? `Last updated ${formatDateISO(last.date)}` : "No measurements yet"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isOpen && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={() => setIsOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Child</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2 ring-zinc-300 dark:ring-zinc-700" placeholder="e.g. Sam" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
                    <option value="">—</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Date of birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">Cancel</button>
              <button disabled={!form.name.trim() || saving} onClick={createChild} className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

