import { calculate, CalculatorInput, MonthInput } from './calculator';

const month = (revenue: number | null = 0, insured = true, minimumDays = 30): MonthInput => ({
  revenue, insured, minimumDays, note: '',
});
const input = (months: MonthInput[], overrides: Partial<CalculatorInput> = {}): CalculatorInput => ({
  status: 'main', minimumType: 'minimum', costRatio: 80, activeDays: 365, months, ...overrides,
});

describe('2026 calculator', () => {
  it('matches the NAV 8–9 page cumulative base example', () => {
    // The NAV table gives income. With an 80% cost ratio, revenue = income × 5.
    const income = [450_000, 400_000, 800_000, 0, 400_000, 400_000, 0, 0, 1_300_000, 300_000, 300_000, 0];
    const months = income.map(value => month(value * 5));
    months[1].minimumDays = 3;
    months[7].insured = false;
    months[7].minimumDays = 0;
    months[11].minimumDays = 26;
    const result = calculate(input(months));
    const cumulativeBases = [2, 5, 8, 11].map(index => result.months.slice(0, index + 1)
      .reduce((total, current) => total + (current.actualBase ?? 0), 0));
    expect(cumulativeBases).toEqual([677_880, 1_646_280, 2_291_880, 3_217_240]);
    expect(result.quarters.map(quarter => quarter.base)).toEqual([0, 0, 83_460, 40_440]);
    expect(result.months[1].actualBase).toBe(32_280);
    expect(result.months[7].actualBase).toBe(0);
    expect(result.months[11].actualBase).toBe(279_760);
  });

  it('uses the guaranteed minimum and keeps it after the exempt threshold is crossed', () => {
    const months = Array.from({ length: 12 }, () => month());
    months[0].revenue = 4_000_000; // 800 000 Ft income, still exempt.
    months[3].revenue = 6_000_000; // Cumulative taxable income, but prior actual bases absorb it.
    const result = calculate(input(months, { minimumType: 'guaranteed' }));
    expect(result.months[0].actualBase).toBe(373_200);
    expect(result.months[0].socialSecurity).toBe(69_042);
    expect(result.months[0].socialContribution).toBe(48_516);
    expect(result.months[3].taxableIncome).toBeGreaterThan(0);
    expect(result.quarters[1].base).toBe(0);
    expect(result.months[3].actualBase).toBe(373_200);
  });

  it('raises both contribution bases when the rolling base exceeds the minimum', () => {
    const months = Array.from({ length: 12 }, () => month());
    months[0].revenue = 20_000_000; // 4 000 000 Ft income.
    const result = calculate(input(months));
    expect(result.quarters[0].base).toBe(687_733);
    expect(result.months[0].actualBase).toBe(687_733);
    expect(result.months[0].socialSecurity).toBe(Math.round(687_733 * 0.185));
    expect(result.months[0].socialContribution).toBe(Math.round(687_733 * 0.13));
  });

  it('applies side and retired status without the main-occupation minimum', () => {
    const months = Array.from({ length: 12 }, () => month());
    months[0].revenue = 15_000_000;
    const side = calculate(input(months, { status: 'side' }));
    const retired = calculate(input(months, { status: 'retired' }));
    expect(side.months[0].actualBase).toBe(side.quarters[0].base);
    expect(retired.months[0].actualBase).toBe(0);
    expect(retired.months[0].socialSecurity).toBe(0);
    expect(retired.incomeTax).toBe(side.incomeTax);
  });

  it('keeps an empty month provisional and treats a filled zero as complete', () => {
    const months = Array.from({ length: 12 }, () => month());
    months[1].revenue = null;
    const partial = calculate(input(months));
    expect(partial.quarters[0].complete).toBe(false);
    expect(partial.months[0].actualBase).toBeNull();
    expect(partial.months[0].incomeTax).toBe(0);
    months[1].revenue = 0;
    const complete = calculate(input(months));
    expect(complete.quarters[0].complete).toBe(true);
    expect(complete.months[0].actualBase).toBe(322_800);
  });

  it('checks prorated revenue limits and the exact exempt-income threshold', () => {
    const months = Array.from({ length: 12 }, () => month());
    months[0].revenue = 9_684_000; // 20% income = 1 936 800 Ft.
    const atLimit = calculate(input(months, { activeDays: 100 }));
    expect(atLimit.months[0].taxableIncome).toBe(0);
    expect(atLimit.revenueLimit).toBe(Math.round(38_736_000 * 100 / 365));
    months[1].revenue = 8_000_000;
    expect(calculate(input(months, { activeDays: 100 })).limitExceeded).toBe(true);
    expect(calculate(input(months, { costRatio: 90 })).revenueLimit).toBe(193_680_000);
  });

  it('rounds each monthly income like Excel at half-forint boundaries', () => {
    const months = Array.from({ length: 12 }, () => month());
    months[0].revenue = 5;
    months[1].revenue = 5;
    const result = calculate(input(months, { costRatio: 90 }));
    expect(result.months[0].income).toBe(1);
    expect(result.months[1].income).toBe(1);
    expect(result.income).toBe(2);
  });
});
