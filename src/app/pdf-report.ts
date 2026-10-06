import type { Content, ContentTable, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Calculation, CalculatorInput, RULES } from './calculator';
import { forint, forintNumber } from './format';

const MONTHS = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
const QUARTERS = ['I.', 'II.', 'III.', 'IV.'];
const NAV_SOURCE = 'NAV 100. információs füzet: Az egyéni vállalkozók átalányadózásának alapvető szabályai (2026. 02. 20.)';

const statusLabel = (status: CalculatorInput['status']): string => ({
  main: 'Főfoglalkozású', side: 'Heti 36 órás munkaviszony / nappali tanulmányok mellett', retired: 'Saját jogú nyugdíjas',
})[status];
const minimumLabel = (minimumType: CalculatorInput['minimumType']): string =>
  minimumType === 'guaranteed' ? 'Garantált bérminimum' : 'Minimálbér';

function table(headers: string[], rows: string[][], widths: number[]): ContentTable {
  return {
    table: {
      headerRows: 1,
      widths,
      body: [headers.map(text => ({ text, style: 'tableHeader' }) as TableCell),
        ...rows.map(row => row.map(text => ({ text }) as TableCell))],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 5, 0, 9],
  };
}

export function pdfFileName(date: Date): string {
  const stamp = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
  return `atalanyado-kalkulator-2026-${stamp}.pdf`;
}

export function buildPdfDefinition(input: CalculatorInput, result: Calculation, date: Date): TDocumentDefinitions {
  const monthlyRows = input.months.map((month, index) => {
    const calculated = result.months[index];
    return [
      MONTHS[index], month.revenue === null ? '— (üres)' : forintNumber(month.revenue),
      month.insured ? 'Igen' : 'Nem', String(month.minimumDays),
      forintNumber(calculated.income), forintNumber(calculated.taxableIncome),
      forintNumber(calculated.incomeTax), forintNumber(calculated.socialSecurity),
      forintNumber(calculated.socialContribution), forintNumber(calculated.totalTax),
    ];
  });
  const quarterRows = result.quarters.map((quarter, index) => [
    `${QUARTERS[index]} ${quarter.complete ? 'negyedév' : 'negyedév – hiányos'}`,
    forintNumber(quarter.revenue), forintNumber(quarter.income),
    quarter.complete ? forintNumber(quarter.incomeTax) : '—',
    forintNumber(quarter.socialSecurity), forintNumber(quarter.socialContribution), forintNumber(quarter.totalTax),
  ]);
  const detailRows = input.months.map((month, index) => {
    const calculated = result.months[index];
    return [
      MONTHS[index], month.note.trim() || '—',
      forintNumber(calculated.cumulativeIncome), forintNumber(calculated.cumulativeTaxable),
      forintNumber(calculated.quarterBase), forintNumber(calculated.minimumBase), forintNumber(calculated.actualBase),
    ];
  });

  const content: Content[] = [
    { text: 'Átalányadó-kalkulátor · 2026', style: 'title' },
    { text: `Készült: ${new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)}   |   Tájékoztató számítás`, style: 'meta' },
    { text: `Jogállás: ${statusLabel(input.status)}   •   Költséghányad: ${input.costRatio}%   •   Minimumalap: ${minimumLabel(input.minimumType)}   •   Aktív napok: ${input.activeDays}`, style: 'settings' },
    { text: result.complete ? 'Éves összesítés' : `Eddig kitöltött adatok (${result.enteredMonths}/12 hónap)`, style: 'section' },
    table(['Bevétel', 'Átalányjövedelem', 'Adóköteles jöv.', 'SZJA-előleg', 'TB-járulék', 'Szocho', result.taxesComplete ? 'Éves közteher' : 'Véglegesített közteher'], [[
      forintNumber(result.revenue), forintNumber(result.income), forintNumber(result.taxableIncome),
      forintNumber(result.incomeTax), forintNumber(result.socialSecurity), forintNumber(result.socialContribution), forintNumber(result.totalTax),
    ]], [108, 110, 110, 97, 97, 88, 120]),
    { text: `Bevételi értékhatár: ${forint(result.revenueLimit)}. ${result.limitExceeded ? 'TÚLLÉPVE – az átalányadózásra való jogosultságot ellenőrizni kell; a kalkuláció nem végleges.' : 'A megadott bevétel alapján nem lépte túl.'}`, style: result.limitExceeded ? 'warning' : 'meta' },
  ];

  if (!result.complete) {
    content.push({ text: 'Az év hiányos. A TB, a szocho és az összes közteher csak a lezárt negyedévekre végleges; az SZJA a számítható hónapokból származik.', style: 'notice' });
  }
  content.push(
    { text: 'Havi bevitel és közterhek (Ft)', style: 'section' },
    table(['Hónap', 'Bevétel', 'Bizt.', 'Nap', 'Átalányjöv.', 'Adóköteles', 'SZJA', 'TB', 'Szocho', 'Összes'], monthlyRows, [68, 81, 36, 29, 83, 85, 73, 72, 72, 83]),
    { text: 'A „—” hiányzó vagy még nem végleges adatot jelöl. A „— (üres)” bevételi mező nem azonos a 0 Ft-tal.', style: 'meta' },
    { text: 'Negyedéves összesítés (Ft)', style: 'section' },
    table(['Időszak', 'Bevétel', 'Átalányjöved.', 'SZJA-előleg', 'TB-járulék', 'Szocho', 'Összes közteher'], quarterRows, [92, 113, 113, 110, 110, 110, 120]),
    { text: 'Hiányos negyedévnél a TB- és szochoeredmény még nem végleges.', style: 'meta' },
    { text: 'Havi számítás részletei (Ft)', style: 'section', pageBreak: 'before' },
    table(['Hónap', 'Megjegyzés', 'Göngyölt átalányjöv.', 'Göngyölt adóköteles', 'Göngyölt havi alap', 'Minimumalap', 'Tényleges alap'], detailRows, [69, 178, 104, 106, 106, 92, 105]),
    { text: 'Módszer és korlátok', style: 'section' },
    { text: `Az adómentes ${forint(RULES.exemptIncome)} az átalányjövedelemre vonatkozik. A negyedéves göngyölítésből a korábbi negyedévek tényleges TB-/szochoalapja levonódik. Főfoglalkozásban a havi minimum akkor is számíthat, amikor nincs adóköteles jövedelem. Az adómentes határ átlépése önmagában nem emeli a TB-t vagy a szochót.`, style: 'paragraph' },
    { text: 'A kalkulátor nem kezeli az adókedvezményeket, a HIPA-t, az áfát, a támogatások speciális kezelését és az évközi jogállás- vagy költséghányad-változást. Bevallás előtt egyeztesd az adatokat a NAV-bevallással.', style: 'paragraph' },
    { text: NAV_SOURCE, style: 'source' },
  );

  return {
    info: { title: '2026-os átalányadó-kalkulátor', subject: 'Tájékoztató átalányadó-kalkuláció' },
    pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [28, 28, 28, 30],
    defaultStyle: { font: 'Roboto', fontSize: 8, color: '#21343b' },
    styles: {
      title: { fontSize: 16, bold: true, color: '#0b655b', margin: [0, 0, 0, 3] },
      meta: { fontSize: 7.5, color: '#5f7076', margin: [0, 0, 0, 5] },
      settings: { fontSize: 8.3, margin: [0, 9, 0, 10] },
      section: { fontSize: 10, bold: true, color: '#174f51', margin: [0, 9, 0, 2] },
      tableHeader: { bold: true, fillColor: '#e8f2f0', color: '#174f51', fontSize: 7.5 },
      warning: { bold: true, color: '#a13322', margin: [0, 4, 0, 6] },
      notice: { color: '#815a20', fontSize: 7.5, margin: [0, 2, 0, 3] },
      paragraph: { fontSize: 8.2, lineHeight: 1.2, margin: [0, 0, 0, 8] },
      source: { color: '#315f62', italics: true, fontSize: 7.5, margin: [0, 6, 0, 0] },
    },
    content,
    footer: (page, pages) => ({ text: `2026-os átalányadó-kalkulátor  •  ${page}/${pages}. oldal`, alignment: 'right', margin: [28, 0, 28, 0], fontSize: 7, color: '#778a8d' }),
  };
}
