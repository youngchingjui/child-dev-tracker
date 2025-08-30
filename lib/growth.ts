export function computeBMI(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  if (h <= 0) return null;
  return +(weightKg / (h * h)).toFixed(1);
}

export function formatDateISO(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function computeAgeYears(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) years -= 1;
  return years;
}

