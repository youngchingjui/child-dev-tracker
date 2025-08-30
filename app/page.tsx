"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

 type Child = {
  id: string;
  name: string;
  birthDate: string; // ISO date string YYYY-MM-DD
  measurements?: Array<{
    id: string;
    date: string;
    heightCm: number;
    weightKg: number;
  }>;
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

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingBirthDate, setEditingBirthDate] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Child[];
        if (Array.isArray(parsed)) {
          setChildren(parsed.map((c) => ({ ...c, measurements: c.measurements ?? [] })));
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

  function resetForm() {
    setName("");
    setBirthDate("");
    setError(null);
  }

  function validate(n: string, bd: string) {
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
    const v = validate(name, birthDate);
    if (v) {
      setError(v);
      return;
    }
    const newChild: Child = { id: uid(), name: name.trim(), birthDate, measurements: [] };
    setChildren((prev) => [...prev, newChild]);
    resetForm();
  }

  function startEdit(c: Child) {
    setEditingId(c.id);
    setEditingName(c.name);
    setEditingBirthDate(c.birthDate);
    setError(null);
  }

  function saveEdit(id: string) {
    const v = validate(editingName, editingBirthDate);
    if (v) {
      setError(v);
      return;
    }
    setChildren((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: editingName.trim(), birthDate: editingBirthDate } : c
      )
    );
    cancelEdit();
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingBirthDate("");
    setError(null);
  }

  function removeChild(id: string) {
    // Simple confirm to prevent accidental deletion
    const c = children.find((x) => x.id === id);
    const label = c ? `${c.name} (${c.birthDate})` : "this child";
    if (confirm(`Delete ${label}?`)) {
      setChildren((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) cancelEdit();
    }
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold">Child Growth Tracker</h1>
        <p className="text-sm text-foreground/70 mt-1">
          Add children and track height, weight, and BMI over time. Data is saved in your browser.
        </p>
      </header>

      <section className="mb-10">
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
      </section>

      <section>
        {!hydrated ? (
          <p className="text-sm text-foreground/70">Loading…</p>
        ) : sortedChildren.length === 0 ? (
          <p className="text-sm text-foreground/70">No children added yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/10 border rounded-md border-black/10 dark:border-white/10">
            {sortedChildren.map((c) => (
              <li key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 justify-between">
                {editingId === c.id ? (
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
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-foreground/70">Born {c.birthDate}</div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="h-9 px-3 rounded-md bg-foreground text-background text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/children/${c.id}`}
                        className="h-9 px-3 rounded-md bg-foreground text-background text-sm font-medium flex items-center"
                      >
                        View growth
                      </Link>
                      <button
                        onClick={() => startEdit(c)}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

