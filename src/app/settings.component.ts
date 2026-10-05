import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CalculatorStateService } from './calculator-state.service';
import { CostRatio, MinimumType, Status } from './calculator';

@Component({
  selector: 'app-settings',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card class="settings">
      <div class="settings-heading"><h2>Beállítások</h2><span>A teljes 2026-os évre</span></div>
      <div class="settings-grid">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Jogállás</mat-label>
          <mat-select [value]="state.state().status" (selectionChange)="setStatus($event.value)">
            <mat-option value="main">Főfoglalkozású</mat-option>
            <mat-option value="side">Heti 36 órás munkaviszony / nappali tanulmányok mellett</mat-option>
            <mat-option value="retired">Saját jogú nyugdíjas</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Minimumalap</mat-label>
          <mat-select [value]="state.state().minimumType" (selectionChange)="setMinimumType($event.value)">
            <mat-option value="guaranteed">Garantált bérminimum</mat-option>
            <mat-option value="minimum">Minimálbér</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Költséghányad</mat-label>
          <mat-select [value]="state.state().costRatio" (selectionChange)="setCostRatio($event.value)">
            <mat-option [value]="45">45%</mat-option><mat-option [value]="80">80%</mat-option><mat-option [value]="90">90%</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="days-field">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Aktív napok (1–365)</mat-label>
            <input matInput #activeDaysInput inputmode="numeric" [value]="state.state().activeDays" (input)="state.updateSettings({activeDays: activeDaysInput.value})" [attr.aria-invalid]="state.activeDaysError()" />
          </mat-form-field>
          @if (state.activeDaysError()) { <small class="field-error" role="alert">1 és 365 közötti egész szám szükséges.</small> }
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .settings { display:grid; grid-template-columns:155px minmax(0,1fr); gap:16px; align-items:center; padding:16px 18px 12px; border:1px solid #dce5e7; box-shadow:none; }
    .settings-heading h2 { font-size:1rem; margin:0 0 3px; }
    .settings-heading span { color:#62747d; font-size:.78rem; }
    .settings-grid { display:grid; grid-template-columns:1.35fr 1.1fr .65fr .8fr; gap:10px; align-items:start; }
    mat-form-field,.days-field { width:100%; min-width:0; }
    .field-error { display:block; color:#a7392b; font-size:.73rem; margin:2px 0 0 4px; }
    @media(max-width:950px) { .settings { grid-template-columns:1fr; gap:12px; } .settings-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(max-width:570px) { .settings-grid { grid-template-columns:1fr; } }
  `],
})
export class SettingsComponent {
  readonly state = inject(CalculatorStateService);
  setStatus(value: Status): void { this.state.updateSettings({ status: value }); }
  setMinimumType(value: MinimumType): void { this.state.updateSettings({ minimumType: value }); }
  setCostRatio(value: CostRatio): void { this.state.updateSettings({ costRatio: value }); }
}
