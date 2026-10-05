import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CalculatorStateService } from './calculator-state.service';
import { MonthsComponent } from './months.component';
import { SettingsComponent } from './settings.component';
import { SummaryComponent } from './summary.component';
import { forint } from './format';
import { RULES } from './calculator';
import { PdfExportService } from './pdf-export.service';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MonthsComponent, SettingsComponent, SummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly state = inject(CalculatorStateService);
  private readonly pdfExport = inject(PdfExportService);
  readonly ft = forint;
  readonly rules = RULES;
  readonly downloading = signal(false);
  readonly pdfError = signal('');

  async downloadPdf(): Promise<void> {
    const result = this.state.result();
    if (!result || this.downloading()) return;
    this.downloading.set(true);
    this.pdfError.set('');
    try {
      await this.pdfExport.download(this.state.input(), result);
    } catch {
      this.pdfError.set('A PDF létrehozása nem sikerült. Próbáld újra.');
    } finally {
      this.downloading.set(false);
    }
  }
}
