export function todayYmdLocal(): string {
  // Returns local date in YYYY-MM-DD, avoiding UTC offset issues
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

