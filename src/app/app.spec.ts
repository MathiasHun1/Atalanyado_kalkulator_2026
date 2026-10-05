import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('renders the 2026 calculator and its source', async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Átalányadó-kalkulátor');
    expect(page.querySelectorAll('.month-row')).toHaveLength(12);
    (page.querySelector('.toggle-cell button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(page.querySelector('.detail-row input[placeholder]')).toBeTruthy();
    expect(page.querySelector('a[href*="nav.gov.hu"]')).toBeTruthy();
  });
});
