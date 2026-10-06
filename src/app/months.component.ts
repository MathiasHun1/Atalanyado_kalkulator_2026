import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { CalculatorStateService } from './calculator-state.service';
import { forint, forintNumber } from './format';

@Component({
  selector: 'app-months',
  imports: [MatButtonModule, MatCardModule, MatCheckboxModule, MatInputModule],
  template: `
    <section aria-labelledby="months-title" class="months">
      <div class="section-heading"><h2 id="months-title">Havi adatok</h2><p>Az üres bevétel hiányzó adat; a 0 rögzített nulla. Az összegek forintban értendők.</p></div>
      <mat-card class="table-card">
        <div class="table-scroll">
          @let calculation = state.result();
          <table>
            <thead><tr>
              <th scope="col">Hónap</th><th scope="col">Bevétel</th><th scope="col" title="Volt legalább egy napig biztosítás?">Bizt.</th><th scope="col" title="Minimumalaphoz figyelembe veendő napok">Nap</th>
              <th scope="col" class="numeric">Jövedelem</th><th scope="col" class="numeric">SZJA</th><th scope="col" class="numeric">TB</th><th scope="col" class="numeric">Szocho</th><th scope="col" class="numeric">Összes</th><th scope="col"><span class="sr-only">Részletek</span></th>
            </tr></thead>
            <tbody>
              @for (month of state.state().months; track $index; let i = $index) {
                <tr class="month-row" [class.unfilled]="month.revenue === ''">
                  <th scope="row">{{ monthNames[i] }}</th>
                  <td><input matInput class="table-input revenue" #revenueInput [id]="'revenue-' + i" inputmode="numeric" [attr.aria-label]="monthNames[i] + ' bevétele forintban'" [value]="month.revenue" (input)="state.updateMonth(i, {revenue: revenueInput.value})" [attr.aria-invalid]="state.revenueErrors()[i]" />@if (state.revenueErrors()[i]) { <small class="field-error" role="alert">Egész, nemnegatív Ft</small> }</td>
                  <td class="checkbox-cell"><mat-checkbox [checked]="month.insured" (change)="state.setInsured(i, $event.checked)" [attr.aria-label]="monthNames[i] + ': volt biztosítás'" /></td>
                  <td><input matInput class="table-input days" #daysInput inputmode="numeric" [attr.aria-label]="monthNames[i] + ': minimumalaphoz számító napok'" [value]="month.minimumDays" [disabled]="!month.insured" (input)="state.updateMonth(i, {minimumDays: daysInput.value})" [attr.aria-invalid]="state.dayErrors()[i]" />@if (state.dayErrors()[i]) { <small class="field-error" role="alert">0–30 nap</small> }</td>
                  <td class="numeric">{{ calculation ? amount(calculation.months[i].income) : '—' }}</td>
                  <td class="numeric">{{ calculation ? amount(calculation.months[i].incomeTax) : '—' }}</td>
                  <td class="numeric">{{ calculation ? amount(calculation.months[i].socialSecurity) : '—' }}</td>
                  <td class="numeric">{{ calculation ? amount(calculation.months[i].socialContribution) : '—' }}</td>
                  <td class="numeric total-cell">{{ calculation ? amount(calculation.months[i].totalTax) : '—' }}</td>
                  <td class="toggle-cell"><button mat-button type="button" [attr.aria-expanded]="openMonth() === i" [attr.aria-label]="monthNames[i] + ' részletei'" (click)="toggle(i)">{{ openMonth() === i ? 'Bezár' : 'Részlet' }}</button></td>
                </tr>
                @if (openMonth() === i) {
                  <tr class="detail-row"><td colspan="10">
                    <div class="detail-content">
                      <label class="note-label">Megjegyzés <input matInput #noteInput class="table-input note" [value]="month.note" (input)="state.updateMonth(i, {note: noteInput.value})" placeholder="Kieső idő, szünetelés…" /></label>
                      @if (calculation; as result) {
                        @let current = result.months[i];
                        <dl>
                          <div><dt>Göngyölt átalányjövedelem</dt><dd>{{ ft(current.cumulativeIncome) }}</dd></div>
                          <div><dt>Havi adóköteles jövedelem</dt><dd>{{ ft(current.taxableIncome) }}</dd></div>
                          <div><dt>Göngyölt adóköteles jövedelem</dt><dd>{{ ft(current.cumulativeTaxable) }}</dd></div>
                          <div><dt>Korábbi negyedévek tényleges alapja</dt><dd>{{ ft(result.quarters[quarterIndex(i)].previousActualBases) }}</dd></div>
                          <div><dt>Biztosított hónapok a negyedévben</dt><dd>{{ result.quarters[quarterIndex(i)].insuredMonths }}</dd></div>
                          <div><dt>Göngyölt havi alap</dt><dd>{{ ft(current.quarterBase) }}</dd></div>
                          <div><dt>Havi minimumalap</dt><dd>{{ ft(current.minimumBase) }}</dd></div>
                          <div><dt>Tényleges TB- és szochoalap</dt><dd>{{ ft(current.actualBase) }}</dd></div>
                        </dl>
                        <p>Az adómentes határ átlépése önmagában nem emeli a TB-t vagy a szochót. Főfoglalkozásban a göngyölt havi alap és a minimum közül a nagyobb számít.</p>
                      }
                    </div>
                  </td></tr>
                }
                @if (i % 3 === 2) {
                  @let quarter = calculation ? calculation.quarters[quarterIndex(i)] : null;
                  <tr class="quarter-row">
                    <th scope="row" colspan="4">{{ roman[quarterIndex(i)] }}. negyedév <span [class.pending]="!quarter?.complete">{{ quarter?.complete ? 'végleges' : 'hiányos' }}</span><small>{{ quarter?.complete ? 'Bevétel:' : 'Bevétel eddig:' }} {{ quarter ? ft(quarter.revenue) : '—' }}</small></th>
                    <td class="numeric">{{ quarter ? amount(quarter.income) : '—' }}</td><td class="numeric">{{ quarter && quarter.complete ? amount(quarter.incomeTax) : '—' }}</td><td class="numeric">{{ quarter ? amount(quarter.socialSecurity) : '—' }}</td><td class="numeric">{{ quarter ? amount(quarter.socialContribution) : '—' }}</td><td class="numeric total-cell">{{ quarter ? amount(quarter.totalTax) : '—' }}</td><td></td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </mat-card>
      <p class="table-note">A TB és a szocho a negyedév vagy egy korábbi hónap hiányzó bevétele esetén még nem végleges. Teljes havi szünetelésnél vedd ki a biztosítás jelölését; részleges szünetelés önmagában nem csökkenti a 30 minimum-napot.</p>
    </section>
  `,
  styles: [`
    .months { margin-top:18px; }
    .section-heading { display:flex; align-items:baseline; justify-content:space-between; gap:20px; margin:0 0 8px; }
    h2 { font-size:1.06rem; margin:0; }
    .section-heading p,.table-note { color:#5e717a; font-size:.78rem; margin:0; }
    .table-card { border:1px solid #dce5e7; box-shadow:none; overflow:hidden; }
    .table-scroll { overflow-x:auto; }
    table { width:100%; min-width:1050px; border-collapse:collapse; font-size:.81rem; font-variant-numeric:tabular-nums; }
    th,td { padding:2px 8px; border-bottom:1px solid #e8eeef; vertical-align:middle; }
    thead th { height:31px; color:#526973; background:#eef4f4; font-size:.74rem; font-weight:700; text-align:left; white-space:nowrap; }
    thead .numeric,td.numeric { text-align:right; }
    tbody .month-row { height:42px; }
    .month-row th { font-weight:650; white-space:nowrap; }
    .month-row.unfilled th { color:#677c83; }
    .month-row:hover { background:#f8fbfb; }
    .table-input { display:block; height:29px; width:100%; padding:4px 7px; border:1px solid #cfdbde; border-radius:5px; background:#fff; color:#193d4b; outline:none; font-size:.81rem; }
    .table-input:focus { border-color:#0b7567; box-shadow:0 0 0 2px #0b756722; }
    .table-input[aria-invalid="true"] { border-color:#b93f2d; }
    .table-input:disabled { background:#eff3f3; color:#6b7e83; }
    .revenue { width:125px; text-align:right; } .days { width:49px; text-align:center; }
    .field-error { display:block; color:#a33725; font-size:.66rem; margin-top:2px; white-space:nowrap; }
    .checkbox-cell { text-align:center; width:55px; } .toggle-cell { text-align:right; }
    .toggle-cell button { height:30px; min-width:0; padding:0 6px; font-size:.73rem; }
    .total-cell { font-weight:750; color:#086d60; white-space:nowrap; }
    .quarter-row { height:30px; background:#e9f2f1; font-weight:650; }
    .quarter-row th { color:#225f5a; white-space:nowrap; }
    .quarter-row span { font-size:.68rem; font-weight:600; color:#14836b; margin-left:7px; }
    .quarter-row span.pending { color:#91621d; }
    .quarter-row small { font-size:.73rem; color:#61787a; font-weight:400; margin-left:12px; }
    .detail-row td { padding:0; background:#f8fbfa; }
    .detail-content { padding:14px 18px; }
    .note-label { display:flex; align-items:center; gap:12px; font-weight:600; }
    .note { max-width:500px; }
    dl { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px 16px; margin:13px 0 8px; }
    dl div { min-width:0; } dt { color:#667b80; font-size:.7rem; } dd { margin:2px 0 0; font-weight:700; }
    .detail-content p { margin:8px 0 0; color:#5d7076; font-size:.78rem; }
    .table-note { margin-top:7px; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
    @media(max-width:700px) { .section-heading { display:block; } .section-heading p { margin-top:4px; } .table-note { line-height:1.4; } }
  `],
})
export class MonthsComponent {
  readonly state = inject(CalculatorStateService);
  readonly openMonth = signal<number | null>(null);
  readonly ft = forint;
  readonly amount = forintNumber;
  readonly monthNames = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
  readonly roman = ['I', 'II', 'III', 'IV'];
  quarterIndex(monthIndex: number): number { return Math.floor(monthIndex / 3); }
  toggle(index: number): void { this.openMonth.update(current => current === index ? null : index); }
}
