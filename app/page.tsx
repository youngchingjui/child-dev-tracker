import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function createChild(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const birthDateStr = String(formData.get("birthDate") || "");
  const sex = String(formData.get("sex") || "").trim() || null;

  if (!name) return;

  const birthDate = birthDateStr ? new Date(birthDateStr) : null;

  await prisma.child.create({
    data: { name, birthDate: birthDate ?? undefined, sex: sex ?? undefined },
  });

  revalidatePath("/");
}

async function deleteChild(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.child.delete({ where: { id } });
  revalidatePath("/");
}

export default async function Home() {
  const children = await prisma.child.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-neutral-950 dark:to-black">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Child Growth Tracker</h1>
          <Link
            href="https://github.com/"
            target="_blank"
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Docs
          </Link>
        </header>

        <section className="mt-8">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50 shadow-sm backdrop-blur p-5">
            <h2 className="text-lg font-medium">Add a child</h2>
            <p className="text-sm text-neutral-500 mt-1">Track height, weight and BMI over time.</p>
            <form action={createChild} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                name="name"
                placeholder="Name"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
              <input
                type="date"
                name="birthDate"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
              />
              <select
                name="sex"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
                defaultValue=""
              >
                <option value="">Sex (optional)</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
              >
                Add child
              </button>
            </form>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Your children</h2>
            <span className="text-sm text-neutral-500">{children.length} total</span>
          </div>
          {children.length === 0 ? (
            <p className="text-neutral-500 text-sm mt-4">No children yet — add one above to get started.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((c) => (
                <li key={c.id} className="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 p-5 shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold leading-none">{c.name}</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {c.birthDate ? new Date(c.birthDate).toLocaleDateString() : "Birthdate not set"}
                        {c.sex ? ` • ${c.sex}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/children/${c.id}`}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Open
                    </Link>
                  </div>
                  <form action={deleteChild} className="mt-4">
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

