import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { compareChars, VerifyValue } from './verify-value';
import { OperationCatalogue } from '../../core/operations/operations.models';

const CATALOGUE: OperationCatalogue = {
  max_batch_items: 500,
  operations: [
    { id: 'visa/cvv2', network: 'visa', network_label: 'Visa', label: 'Visa CVV2', type: 'CVV2', path: '/api/visa/cvv2',
      result_format: '3 digits', result_pattern: '^[0-9]{3}$',
      fields: [{ name: 'pan', label: 'Tag 5A (PAN)', example: '4111111111111111' },
               { name: 'expiry', label: 'Expiry Date (YYMM)', example: '3012' }] },
    { id: 'visa/arpc', network: 'visa', network_label: 'Visa', label: 'Visa ARPC', type: 'ARPC', path: '/api/visa/arpc',
      result_format: '16 hex characters', result_pattern: '^[0-9A-F]{16}$',
      fields: [{ name: 'arqc', label: 'Tag 9F26 (ARQC)', example: '37858601E2285A5D' },
               { name: 'tag_8a', label: 'Tag 8A (Authorisation Response Code)', example: '3030' }] }
  ]
};

describe('VerifyValue', () => {
  let fixture: ComponentFixture<VerifyValue>;
  let component: VerifyValue;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyValue],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(VerifyValue);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    http.expectOne('/api/operations').flush(CATALOGUE);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function type(selector: string, value: string) {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit() {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('builds the form from the catalogue, grouped by network', () => {
    expect(el.querySelector('optgroup')?.getAttribute('label')).toBe('Visa');
    expect(el.querySelectorAll('option').length).toBe(2);
    expect(el.textContent).toContain('Tag 5A (PAN)');
    expect(el.textContent).toContain('Received CVV2');
  });

  it('fills in example values', () => {
    (el.querySelector('.link-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((el.querySelector('#f-pan') as HTMLInputElement).value).toBe('4111111111111111');
  });

  it('does not call the API until every field is filled and the received value has the right format', () => {
    submit();
    expect(el.textContent).toContain('This field is required');
    component.useExampleValues();
    type('#received', '59');
    submit();
    expect(el.textContent).toContain('Please enter 3 digits');
    http.expectNone('/api/verify');
  });

  it('shows a match', () => {
    component.useExampleValues();
    type('#received', '597');
    submit();
    const req = http.expectOne('/api/verify');
    expect(req.request.body).toEqual({ operation: 'visa/cvv2', input: { pan: '4111111111111111', expiry: '3012' }, received: '597' });
    req.flush({ operation: 'visa/cvv2', type: 'CVV2', valid: true, expected: '597', received: '597' });
    fixture.detectChanges();
    expect(el.querySelector('.outcome.ok')?.textContent).toContain('Match');
  });

  it('shows a mismatch with the expected value and the differing characters', () => {
    component.useExampleValues();
    type('#received', '598');
    submit();
    http.expectOne('/api/verify').flush({ operation: 'visa/cvv2', type: 'CVV2', valid: false, expected: '597', received: '598' });
    fixture.detectChanges();
    const outcome = el.querySelector('.outcome.bad')!;
    expect(outcome.textContent).toContain('No match');
    expect(outcome.textContent).toContain('597');
    expect(outcome.querySelectorAll('.diff').length).toBe(1);
  });

  it('shows friendly API errors', () => {
    component.useExampleValues();
    type('#received', '597');
    submit();
    http.expectOne('/api/verify').flush('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();
    expect(el.textContent).toContain('The service is unreachable');
  });

  it('starts again when another value is chosen', () => {
    component.useExampleValues();
    component.select('visa/arpc');
    fixture.detectChanges();
    expect(el.textContent).toContain('Tag 9F26 (ARQC)');
    expect(component.values()).toEqual({});
  });

  it('marks differing characters', () => {
    expect(compareChars('ABCD', 'ABXD').map(c => c.same)).toEqual([true, true, false, true]);
  });
});
