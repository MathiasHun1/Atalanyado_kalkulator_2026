import { computed, effect, Injectable, signal } from '@angular/core';
import { calculate, CalculatorInput, CostRatio, MinimumType, Status } from './calculator';

export interface MonthDraft {
  revenue: string;
  insured: boolean;
  minimumDays: string;
  note: string;
}

interface Draft {
  status: Status;
  minimumType: MinimumType;
  costRatio: CostRatio;
  activeDays: string;
  months: MonthDraft[];
}

const KEY = 'atalanyado-2026-v1';
const months = () => Array.from({ length: 12 }, (): MonthDraft => ({
  revenue: '', insured: true, minimumDays: '30', note: '',
}));
const defaults = (): Draft => ({
  status: 'main', minimumType: 'guaranteed', costRatio: 45, activeDays: '365', months: months(),
});

export function wholeNumber(value: string, max: number, allowEmpty = false): number | null {
  const trimmed = value.trim();
  if (allowEmpty && trimmed === '') return null;
  if (!/^(0|[1-9]\d*)$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isSafeInteger(number) && number <= max ? number : null;
}

function restore(value: unknown): Draft | null {
  if (!value || typeof value !== 'object') return null;
  const saved = value as Record<string, unknown>;
  if (saved['version'] !== 1 || !saved['data'] || typeof saved['data'] !== 'object') return null;
  const data = saved['data'] as Record<string, unknown>;
  if (!['main', 'side', 'retired'].includes(data['status'] as string) ||
      !['minimum', 'guaranteed'].includes(data['minimumType'] as string) ||
      typeof data['costRatio'] !== 'number' || ![45, 80, 90].includes(data['costRatio']) ||
      typeof data['activeDays'] !== 'string' || !Array.isArray(data['months']) || data['months'].length !== 12) return null;
  if (!data['months'].every((month: unknown) => {
    if (!month || typeof month !== 'object') return false;
    const m = month as Record<string, unknown>;
    return typeof m['revenue'] === 'string' && typeof m['insured'] === 'boolean' &&
      typeof m['minimumDays'] === 'string' && typeof m['note'] === 'string';
  })) return null;
  return data as unknown as Draft;
}

@Injectable({ providedIn: 'root' })
export class CalculatorStateService {
  private readonly draft = signal<Draft>(this.load());
  readonly state = this.draft.asReadonly();
  readonly activeDaysError = computed(() => wholeNumber(this.state().activeDays, 365) === null ||
    Number(this.state().activeDays) < 1);
  readonly dayErrors = computed(() => this.state().months.map(month =>
    wholeNumber(month.minimumDays, 30) === null || (!month.insured && month.minimumDays !== '0')));
  readonly revenueErrors = computed(() => this.state().months.map(month =>
    month.revenue.trim() !== '' && wholeNumber(month.revenue, Number.MAX_SAFE_INTEGER) === null));
  readonly hasErrors = computed(() => this.activeDaysError() || this.dayErrors().some(Boolean) || this.revenueErrors().some(Boolean));
  readonly input = computed<CalculatorInput>(() => ({
    status: this.state().status,
    minimumType: this.state().minimumType,
    costRatio: this.state().costRatio,
    activeDays: wholeNumber(this.state().activeDays, 365) ?? 365,
    months: this.state().months.map(month => ({
      revenue: wholeNumber(month.revenue, Number.MAX_SAFE_INTEGER, true),
      insured: month.insured,
      minimumDays: wholeNumber(month.minimumDays, 30) ?? 0,
      note: month.note,
    })),
  }));
  readonly result = computed(() => this.hasErrors() ? null : calculate(this.input()));

  constructor() {
    effect(() => {
      const state = this.state();
      try { localStorage.setItem(KEY, JSON.stringify({ version: 1, data: state })); } catch { /* Tárolás nélkül is használható. */ }
    });
  }

  private load(): Draft {
    try { return restore(JSON.parse(localStorage.getItem(KEY) ?? 'null')) ?? defaults(); }
    catch { return defaults(); }
  }

  updateSettings(patch: Partial<Omit<Draft, 'months'>>): void {
    this.draft.update(current => ({ ...current, ...patch }));
  }

  updateMonth(index: number, patch: Partial<MonthDraft>): void {
    this.draft.update(current => ({
      ...current,
      months: current.months.map((month, i) => i === index ? { ...month, ...patch } : month),
    }));
  }

  setInsured(index: number, insured: boolean): void {
    this.updateMonth(index, { insured, minimumDays: insured ? '30' : '0' });
  }

  clear(): void {
    this.draft.set(defaults());
    try { localStorage.removeItem(KEY); } catch { /* Tárolás nélkül is használható. */ }
  }
}
