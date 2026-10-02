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
});
