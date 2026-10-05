import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CalculatorStateService } from './calculator-state.service';
import { forint } from './format';

@Component({
  selector: 'app-summary',
  imports: [MatCardModule],
  template: `
    @if (state.result(); as result) {
      <section aria-labelledby="overview-title" class="overview">
        @if (result.limitExceeded) {
          <div class="warning" role="alert"><strong>Bevételi értékhatár túllépve.</strong> Ellenőrizd a jogosultságot; az eredmény így nem tekinthető véglegesnek.</div>
        }
        <mat-card class="summary-card">
          <div class="summary-heading"><h2 id="overview-title">{{ result.complete ? '2026. éves összesítés' : 'Eddigi összesítés' }}</h2><span>{{ result.enteredMonths }}/12 hónap kitöltve</span></div>
          <div class="metrics">
            <div><span>Bevétel</span><strong>{{ ft(result.revenue) }}</strong></div>
            <div><span>Átalányjövedelem</span><strong>{{ ft(result.income) }}</strong></div>
            <div><span>Adóköteles jövedelem</span><strong>{{ ft(result.taxableIncome) }}</strong></div>
            <div class="highlight"><span>{{ result.taxesComplete ? 'Éves közteher' : 'Véglegesített közteher' }}</span><strong>{{ ft(result.totalTax) }}</strong></div>
          </div>
          <div class="summary-foot">
            <span>SZJA: <b>{{ ft(result.incomeTax) }}</b> · TB: <b>{{ ft(result.socialSecurity) }}</b> · Szocho: <b>{{ ft(result.socialContribution) }}</b></span>
            <span>Bevételi értékhatár: <b>{{ ft(result.revenueLimit) }}</b></span>
          </div>
        </mat-card>
        @if (!result.complete) { <p class="partial-note">Az év hiányos. A TB, a szocho és az összes közteher csak a lezárt negyedévekre végleges; az SZJA a számítható hónapokból származik.</p> }
      </section>
    }
  `,
  styles: [`
    .overview { margin-top:14px; }
    .summary-card { padding:14px 18px 10px; border:1px solid #dce5e7; box-shadow:none; }
    .summary-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
    h2 { font-size:1rem; margin:0; }
    .summary-heading span { color:#506871; font-size:.8rem; }
    .metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0; }
    .metrics>div { display:flex; flex-direction:column; gap:4px; min-width:0; padding:4px 16px; border-left:1px solid #dae5e6; }
    .metrics>div:first-child { border-left:0; padding-left:0; }
    .metrics span { color:#5d727b; font-size:.8rem; }
    .metrics strong { color:#183d48; font-size:clamp(1.1rem,1.65vw,1.5rem); letter-spacing:-.03em; white-space:nowrap; }
    .metrics .highlight strong { color:#087466; }
    .summary-foot { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; border-top:1px solid #e1e9ea; padding-top:10px; margin-top:12px; color:#536b73; font-size:.8rem; }
    .summary-foot b { color:#243f48; }
    .partial-note { margin:5px 2px 0; color:#756447; font-size:.76rem; }
    .warning { margin-bottom:10px; border:1px solid #e3aa84; background:#fff0e8; color:#7d3416; padding:10px 14px; border-radius:8px; }
    @media(max-width:900px) { .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px 0; } .metrics>div:nth-child(3) { border-left:0; padding-left:0; } }
    @media(max-width:550px) { .metrics strong { white-space:normal; } .summary-heading { align-items:start; } }
  `],
})
export class SummaryComponent {
  readonly state = inject(CalculatorStateService);
  readonly ft = forint;
}
