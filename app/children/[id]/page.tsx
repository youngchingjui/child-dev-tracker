import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";

function computeBmi(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg || heightCm <= 0) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  return Math.round(bmi * 10) / 10; // 1 decimal place
}

async function addMeasurement(childId: string, formData: FormData) {
  "use server";
  const dateStr = String(formData.get("date") || "");
  const heightCm = formData.get("heightCm") ? Number(formData.get("heightCm")) : null;
  const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
  const note = String(formData.get("note") || "").trim() || null;

  await prisma.measurement.create({
    data: {
      childId,
      date: dateStr ? new Date(dateStr) : new Date(),
      heightCm: heightCm ?? undefined,
      weightKg: weightKg ?? undefined,
      bmi: computeBmi(heightCm, weightKg) ?? undefined,
      note: note ?? undefined,
    },
  });

  revalidatePath(`/children/${childId}`);
}

async function updateMeasurement(childId: string, formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;

  const dateStr = String(formData.get("date") || "");
  const heightCm = formData.get("heightCm") ? Number(formData.get("heightCm")) : null;
  const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
  const note = String(formData.get("note") || "").trim() || null;

  await prisma.measurement.update({
    where: { id },
    data: {
      date: dateStr ? new Date(dateStr) : undefined,
      heightCm: heightCm ?? undefined,
      weightKg: weightKg ?? undefined,
      bmi: computeBmi(heightCm, weightKg) ?? undefined,
      note: note ?? undefined,
    },
  });

  revalidatePath(`/children/${childId}`);
}

async function deleteMeasurement(childId: string, formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.measurement.delete({ where: { id } });
  revalidatePath(`/children/${childId}`);
}

export default async function ChildDetail({ params }: { params: { id: string } }) {
  const childId = params.id;
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: { measurements: { orderBy: { date: "desc" } } },
  });

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">Child not found.</p>
          <Link href="/" className="text-sky-600 hover:underline mt-2 inline-block">Go back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-neutral-950 dark:to-black">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">← Back</Link>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-2">{child.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {child.birthDate ? new Date(child.birthDate).toLocaleDateString() : "Birthdate not set"}
              {child.sex ? ` • ${child.sex}` : ""}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50 shadow-sm backdrop-blur p-5">
            <h2 className="text-lg font-medium">Add measurement</h2>
            <form action={addMeasurement.bind(null, child.id)} className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input type="date" name="date" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
              <input type="number" step="0.1" min="0" name="heightCm" placeholder="Height (cm)" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
              <input type="number" step="0.1" min="0" name="weightKg" placeholder="Weight (kg)" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
              <input name="note" placeholder="Note (optional)" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 shadow-sm">Add</button>
            </form>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Measurements</h2>
          {child.measurements.length === 0 ? (
            <p className="text-neutral-500 text-sm mt-4">No measurements yet — add one above.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {child.measurements.map((m) => (
                <li key={m.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{new Date(m.date).toLocaleDateString()}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {m.heightCm ? `${m.heightCm} cm` : "—"} • {m.weightKg ? `${m.weightKg} kg` : "—"}
                        {m.bmi ? ` • BMI ${m.bmi}` : ""}
                      </p>
                      {m.note ? <p className="text-xs text-neutral-500 mt-1">{m.note}</p> : null}
                    </div>
                    <form action={deleteMeasurement.bind(null, child.id)}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="text-xs text-red-600 hover:text-red-700">Delete</button>
                    </form>
                  </div>

                  <details className="mt-4">
                    <summary className="text-xs text-neutral-600 hover:text-neutral-800 cursor-pointer">Edit</summary>
                    <form action={updateMeasurement.bind(null, child.id)} className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="date" name="date" defaultValue={new Date(m.date).toISOString().slice(0, 10)} className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
                      <input type="number" step="0.1" min="0" name="heightCm" defaultValue={m.heightCm ?? undefined} placeholder="Height (cm)" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
                      <input type="number" step="0.1" min="0" name="weightKg" defaultValue={m.weightKg ?? undefined} placeholder="Weight (kg)" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
                      <input name="note" defaultValue={m.note ?? undefined} placeholder="Note" className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400" />
                      <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-200 text-white dark:text-black text-sm font-medium px-4 py-2 shadow-sm">Save</button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

