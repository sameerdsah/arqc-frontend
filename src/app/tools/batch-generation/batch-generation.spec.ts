import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BatchGeneration } from './batch-generation';
import { OperationCatalogue } from '../../core/operations/operations.models';

const CATALOGUE: OperationCatalogue = {
  max_batch_items: 500,
  operations: [
    { id: 'visa/cvv2', network: 'visa', network_label: 'Visa', label: 'Visa CVV2', type: 'CVV2', path: '/api/visa/cvv2',
      result_format: '3 digits', result_pattern: '^[0-9]{3}$',
      fields: [{ name: 'pan', label: 'Tag 5A (PAN)', example: '4111111111111111' },
               { name: 'expiry', label: 'Expiry Date (YYMM)', example: '3012' }] }
  ]
};

describe('BatchGeneration', () => {
  let fixture: ComponentFixture<BatchGeneration>;
  let component: BatchGeneration;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchGeneration],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(BatchGeneration);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    http.expectOne('/api/operations').flush(CATALOGUE);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function load(csv: string) {
    (component as any).load(csv, 'test.csv');
    fixture.detectChanges();
  }

  it('lists the operations and the expected CSV columns', () => {
    expect(el.querySelector('option')?.textContent).toContain('Visa CVV2');
    expect(el.textContent).toContain('pan');
    expect(el.textContent).toContain('received');
  });

  it('checks the file before anything is sent', () => {
    load('pan\n4111111111111111');
    expect(el.textContent).toContain('Missing column(s) for Visa CVV2: expiry');
    component.run();
    http.expectNone('/api/batch');
  });

  it('runs the batch and shows each row with its status and a summary', () => {
    load('ref,pan,expiry,received\na,4111111111111111,3012,\nb,4111111111111111,3012,597\nc,4111111111111111,3012,598\nd,4111,3012,');
    expect(el.textContent).toContain('4 rows ready from test.csv');

    (el.querySelector('button.primary') as HTMLButtonElement).click();
    const req = http.expectOne('/api/batch');
    expect(req.request.body.operation).toBe('visa/cvv2');
    expect(req.request.body.items.length).toBe(4);
    expect(req.request.body.items[1]).toEqual({ ref: 'b', input: { pan: '4111111111111111', expiry: '3012' }, received: '597' });
    req.flush({ operation: 'visa/cvv2', type: 'CVV2',
      summary: { total: 4, succeeded: 3, failed: 1, matched: 1, mismatched: 1 },
      results: [{ index: 0, ref: 'a', result: '597' }, { index: 1, ref: 'b', result: '597', received: '597', valid: true },
                { index: 2, ref: 'c', result: '597', received: '598', valid: false },
                { index: 3, ref: 'd', error: 'PAN must be 13-19 digits' }] });
    fixture.detectChanges();

    const rows = Array.from(el.querySelectorAll('tbody tr')).map(r => r.textContent ?? '');
    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Generated');
    expect(rows[1]).toContain('Match');
    expect(rows[2]).toContain('No match');
    expect(rows[3]).toContain('PAN must be 13-19 digits');
    expect(el.querySelector('.summary')?.textContent).toContain('No match 1');
  });

  it('can load sample rows for a quick try', () => {
    component.loadSampleRows();
    fixture.detectChanges();
    expect(el.textContent).toContain('3 rows ready from sample rows');
  });

  it('shows friendly errors, e.g. when the rate limit is reached', () => {
    component.loadSampleRows();
    component.run();
    http.expectOne('/api/batch').flush({ error: 'Rate limit exceeded' },
      { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '20' } });
    fixture.detectChanges();
    expect(el.textContent).toContain('Too many requests – please wait 20 seconds and try again.');
  });

  it('explains the mismatches: counts the causes, filters the rows by cause and shows the fix', () => {
    load('ref,pan,expiry,received\na,4111111111111111,3012,598\nb,4111111111111111,3012,598\nc,4111111111111111,3012,999\nd,4111111111111111,3012,597');
    component.run();
    const req = http.expectOne('/api/batch');
    expect(req.request.body.diagnose).toBe(true);
    const finding = { cause: 'pan-transposition', title: 'PAN digits swapped', confidence: 'possible', explanation: 'Swapped.',
                      changes: [{ field: 'pan', label: 'PAN', from: '4111111111111111', to: '1411111111111111' }] };
    req.flush({ operation: 'visa/cvv2', type: 'CVV2',
      summary: { total: 4, succeeded: 4, failed: 0, matched: 1, mismatched: 3,
                 causes: [{ cause: 'pan-transposition', title: 'PAN digits swapped', count: 2 },
                          { cause: 'unexplained', title: 'No common cause found', count: 1 }] },
      results: [{ index: 0, ref: 'a', result: '597', received: '598', valid: false, diagnosis: { checked: 3, findings: [finding] } },
                { index: 1, ref: 'b', result: '597', received: '598', valid: false, diagnosis: { checked: 3, findings: [finding] } },
                { index: 2, ref: 'c', result: '597', received: '999', valid: false, diagnosis: { checked: 20, findings: [] } },
                { index: 3, ref: 'd', result: '597', received: '597', valid: true }] });
    fixture.detectChanges();

    expect(el.querySelector('.causes h3')?.textContent).toContain('Why 3 values do not match');
    const causes = Array.from(el.querySelectorAll<HTMLButtonElement>('.cause-row'));
    expect(causes.map(c => [c.querySelector('.cause-title')?.textContent?.trim(), c.querySelector('.count')?.textContent?.trim()]))
      .toEqual([['PAN digits swapped', '2'], ['No common cause found', '1']]);
    expect(el.querySelector('thead')?.textContent).toContain('Cause');
    expect(el.querySelector('tbody tr .fix')?.textContent).toBe('pan: 4111111111111111 -> 1411111111111111');

    causes[1].click();
    fixture.detectChanges();
    const rows = Array.from(el.querySelectorAll('tbody tr')).map(r => r.textContent ?? '');
    expect(rows.length).toBe(1);
    expect(rows[0]).toContain('No common cause found');
    causes[1].click();
    fixture.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(4);
  });

  it('does not ask for explanations when no row has a received value', () => {
    component.loadSampleRows();
    component.run();
    const req = http.expectOne('/api/batch');
    expect(req.request.body.diagnose).toBeUndefined();
    req.flush({ operation: 'visa/cvv2', type: 'CVV2', summary: { total: 3, succeeded: 3, failed: 0 }, results: [] });
  });
});
