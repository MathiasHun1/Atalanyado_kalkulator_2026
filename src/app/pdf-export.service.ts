import { Injectable } from '@angular/core';
import { Calculation, CalculatorInput } from './calculator';
import { buildPdfDefinition, pdfFileName } from './pdf-report';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async createBlob(input: CalculatorInput, result: Calculation, createdAt = new Date()): Promise<Blob> {
    const definition = buildPdfDefinition(input, result, createdAt);
    // Both the renderer and its Roboto font files are bundled locally and loaded only on demand.
    const [renderer, fonts] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);
    const pdfMake = renderer.default ?? renderer;
    const vfs = fonts.default ?? fonts;
    return new Promise<Blob>(resolve => {
      pdfMake.createPdf(definition, undefined, undefined, vfs).getBlob(resolve);
    });
  }

  async download(input: CalculatorInput, result: Calculation): Promise<void> {
    const createdAt = new Date();
    const blob = await this.createBlob(input, result, createdAt);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFileName(createdAt);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
