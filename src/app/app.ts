import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CalculatorStateService } from './calculator-state.service';
import { MonthsComponent } from './months.component';
import { SettingsComponent } from './settings.component';
import { SummaryComponent } from './summary.component';
import { forint } from './format';
import { RULES } from './calculator';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MonthsComponent, SettingsComponent, SummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly state = inject(CalculatorStateService);
  readonly ft = forint;
  readonly rules = RULES;
}
