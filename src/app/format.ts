const formatter = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 });
export function forintNumber(value: number | null): string {
  return value === null ? '—' : formatter.format(value);
}
export function forint(value: number | null): string {
  return value === null ? '—' : `${forintNumber(value)} Ft`;
}
