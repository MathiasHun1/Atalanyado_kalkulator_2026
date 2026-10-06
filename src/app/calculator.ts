export type Status = 'main' | 'side' | 'retired';
export type MinimumType = 'minimum' | 'guaranteed';
export type CostRatio = 45 | 80 | 90;

export interface MonthInput {
  revenue: number | null;
  insured: boolean;
  minimumDays: number;
  note: string;
}

export interface CalculatorInput {
  status: Status;
  minimumType: MinimumType;
  costRatio: CostRatio;
  activeDays: number;
  months: MonthInput[];
}

export interface MonthResult {
  revenue: number | null;
  income: number | null;
  cumulativeIncome: number | null;
  taxableIncome: number | null;
  cumulativeTaxable: number | null;
  quarterBase: number | null;
  minimumBase: number;
  actualBase: number | null;
  incomeTax: number | null;
  socialSecurity: number | null;
  socialContribution: number | null;
  totalTax: number | null;
}

export interface QuarterResult {
  complete: boolean;
  insuredMonths: number;
  cumulativeTaxable: number | null;
  previousActualBases: number;
  base: number | null;
  revenue: number;
  income: number;
  incomeTax: number;
  socialSecurity: number | null;
  socialContribution: number | null;
  totalTax: number | null;
}

export interface Calculation {
  months: MonthResult[];
  quarters: QuarterResult[];
  revenueLimit: number;
  limitExceeded: boolean;
  enteredMonths: number;
  complete: boolean;
  revenue: number;
  income: number;
  taxableIncome: number;
  incomeTax: number;
  socialSecurity: number;
  socialContribution: number;
  totalTax: number;
  taxesComplete: boolean;
}

export const RULES = {
  minimumWage: 322_800,
  guaranteedWage: 373_200,
  exemptIncome: 1_936_800,
  incomeTaxRate: 0.15,
  socialSecurityRate: 0.185,
  socialContributionRate: 0.13,
} as const;

// Excel ROUND(x, 0) on nonnegative amounts, without binary floating-point half errors.
const roundRatio = (value: number, numerator: number, denominator: number): number =>
  Number((BigInt(value) * BigInt(numerator) + BigInt(Math.floor(denominator / 2))) / BigInt(denominator));
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function calculate(input: CalculatorInput): Calculation {
  if (input.months.length !== 12) throw new Error('Pontosan 12 havi adat szükséges.');
  const wage = input.minimumType === 'guaranteed' ? RULES.guaranteedWage : RULES.minimumWage;
  const months: MonthResult[] = [];
  let cumulativeIncome = 0;
  let previousCumulativeTaxable = 0;
  let previousActualBases = 0;
  let cumulativeComplete = true;

  for (const month of input.months) {
    const revenue = month.revenue;
    const income = revenue === null ? null : roundRatio(revenue, 100 - input.costRatio, 100);
    cumulativeComplete = cumulativeComplete && income !== null;
    if (income !== null) cumulativeIncome += income;
    const cumulativeTaxable = cumulativeComplete
      ? Math.max(0, cumulativeIncome - RULES.exemptIncome) : null;
    const taxableIncome = cumulativeTaxable === null ? null : cumulativeTaxable - previousCumulativeTaxable;
    if (cumulativeTaxable !== null) previousCumulativeTaxable = cumulativeTaxable;
    const minimumBase = input.status === 'main' && month.insured
      ? roundRatio(wage, month.minimumDays, 30) : 0;
    months.push({
      revenue, income,
      cumulativeIncome: cumulativeComplete ? cumulativeIncome : null,
      taxableIncome, cumulativeTaxable,
      quarterBase: null, minimumBase, actualBase: null,
      incomeTax: taxableIncome === null ? null : roundRatio(taxableIncome, 15, 100),
      socialSecurity: null, socialContribution: null, totalTax: null,
    });
  }

  const quarters: QuarterResult[] = [];
  let previousQuartersComplete = true;
  for (let quarter = 0; quarter < 4; quarter++) {
    const start = quarter * 3;
    const source = input.months.slice(start, start + 3);
    const result = months.slice(start, start + 3);
    const complete: boolean = previousQuartersComplete && source.every(month => month.revenue !== null);
    const insuredMonths = source.filter(month => month.insured).length;
    const cumulativeTaxable = complete ? result[2].cumulativeTaxable : null;
    const base = complete && cumulativeTaxable !== null && insuredMonths > 0
      ? roundRatio(Math.max(0, cumulativeTaxable - previousActualBases), 1, insuredMonths) : complete ? 0 : null;
    const previousBasesForQuarter = previousActualBases;
    if (complete) {
      for (let offset = 0; offset < 3; offset++) {
        const month = result[offset];
        const sourceMonth = source[offset];
        month.quarterBase = sourceMonth.insured ? base : 0;
        const actualBase = input.status === 'retired' || !sourceMonth.insured ? 0
          : input.status === 'main' ? Math.max(base ?? 0, month.minimumBase) : base ?? 0;
        month.actualBase = actualBase;
        month.socialSecurity = roundRatio(actualBase, 185, 1000);
        month.socialContribution = roundRatio(actualBase, 13, 100);
        month.totalTax = (month.incomeTax ?? 0) + month.socialSecurity + month.socialContribution;
        previousActualBases += actualBase;
      }
    }
    const incomeTax = sum(result.map(month => month.incomeTax ?? 0));
    const socialSecurity = complete ? sum(result.map(month => month.socialSecurity ?? 0)) : null;
    const socialContribution = complete ? sum(result.map(month => month.socialContribution ?? 0)) : null;
    quarters.push({
      complete, insuredMonths, cumulativeTaxable, previousActualBases: previousBasesForQuarter,
      base, revenue: sum(result.map(month => month.revenue ?? 0)),
      income: sum(result.map(month => month.income ?? 0)), incomeTax,
      socialSecurity, socialContribution,
      totalTax: complete ? incomeTax + (socialSecurity ?? 0) + (socialContribution ?? 0) : null,
    });
    previousQuartersComplete = complete;
  }

  const revenue = sum(months.map(month => month.revenue ?? 0));
  const revenueLimit = roundRatio(input.costRatio === 90 ? 193_680_000 : 38_736_000, input.activeDays, 365);
  const enteredMonths = months.filter(month => month.revenue !== null).length;
  return {
    months, quarters, revenueLimit, limitExceeded: revenue > revenueLimit,
    enteredMonths, complete: enteredMonths === 12, revenue,
    income: sum(months.map(month => month.income ?? 0)),
    taxableIncome: sum(months.map(month => month.taxableIncome ?? 0)),
    incomeTax: sum(months.map(month => month.incomeTax ?? 0)),
    socialSecurity: sum(months.map(month => month.socialSecurity ?? 0)),
    socialContribution: sum(months.map(month => month.socialContribution ?? 0)),
    totalTax: sum(months.map(month => month.totalTax ?? 0)),
    taxesComplete: enteredMonths === 12 && quarters.every(quarter => quarter.complete),
  };
}
