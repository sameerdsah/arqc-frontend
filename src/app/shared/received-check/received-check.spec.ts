import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReceivedValueCheck } from './received-check';
import { DiagnosisFinding, OperationCatalogue } from '../../core/operations/operations.models';

const CATALOGUE: OperationCatalogue = {
  max_batch_items: 500,
  operations: [{ id: 'visa/arqc', network: 'visa', network_label: 'Visa', label: 'Visa ARQC', type: 'ARQC',
                 path: '/api/visa/arqc', result_format: '16 hex characters', result_pattern: '^[0-9A-F]{16}$',
                 fields: [{ name: 'tag_9f36', label: 'Tag 9F36 (Application Transaction Counter)', example: '0001' }] }]
};
const ATC: DiagnosisFinding = {
  cause: 'atc-drift', confidence: 'certain', explanation: 'The received cryptogram belongs to a later transaction.',
  changes: [{ field: 'tag_9f36', label: 'Tag 9F36 (Application Transaction Counter)', from: '0001', to: '0002' }]
};

describe('ReceivedValueCheck', () => {
  let fixture: ComponentFixture<ReceivedValueCheck>;
  let component: ReceivedValueCheck;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedValueCheck],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(ReceivedValueCheck);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('path', '/api/visa/arqc');
    fixture.componentRef.setInput('valueName', 'ARQC');
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function type(value: string) {
    const input = el.querySelector('#received') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function calculated(result: string, atc = '0001') {
    fixture.componentRef.setInput('calculation', { input: { tag_9f36: atc }, result });
    fixture.detectChanges();
  }

  it('is a closed, optional section until it is used', () => {
    expect(el.querySelector('.check-toggle')?.textContent).toContain('Compare with a value you received');
    expect(el.querySelector('#received')).toBeNull();
    (el.querySelector('.check-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('#received')).not.toBeNull();
  });

  it('opens by itself when the received value is filled, e.g. from chip data', () => {
    fixture.componentRef.setInput('received', '949BBD6013450C7D');
    fixture.detectChanges();
    expect((el.querySelector('#received') as HTMLInputElement).value).toBe('949BBD6013450C7D');
    expect(el.textContent).toContain('Press Submit');
  });

  it('gives an instant local verdict without calling the API for a match', () => {
    component.open();
    fixture.detectChanges();
    type(' 949bbd6013450c7d ');
    calculated('949BBD6013450C7D');
    expect(el.querySelector('.outcome.ok')?.textContent).toContain('Match');
    http.expectNone('/api/verify');
  });

  it('checks the format against the calculated value', () => {
    calculated('949BBD6013450C7D');
    component.open();
    fixture.detectChanges();
    type('949B');
    expect(el.textContent).toContain('Please enter 16 hex characters');
    expect(el.querySelector('app-check-outcome')).toBeNull();
  });

  it('explains a mismatch and applies the fix, which then matches', () => {
    let patch: Record<string, string> | null = null;
    component.apply.subscribe(p => patch = p);
    calculated('949BBD6013450C7D');
    component.open();
    fixture.detectChanges();
    type('673A05ED91892AF8');
    expect(el.textContent).toContain('Looking for the cause');

    http.expectOne('/api/operations').flush(CATALOGUE);
    const req = http.expectOne('/api/verify');
    expect(req.request.body).toEqual({ operation: 'visa/arqc', input: { tag_9f36: '0001' },
                                       received: '673A05ED91892AF8', diagnose: true });
    req.flush({ operation: 'visa/arqc', type: 'ARQC', valid: false, expected: '949BBD6013450C7D',
                received: '673A05ED91892AF8', diagnosis: { checked: 1, findings: [ATC] } });
    fixture.detectChanges();
    expect(el.querySelector('.finding')?.textContent).toContain('later transaction');

    (el.querySelector('.apply-btn') as HTMLButtonElement).click();
    expect(patch).toEqual({ tag_9f36: '0002' });
    calculated('673A05ED91892AF8', '0002');           // the page recalculated with the change
    expect(el.querySelector('.outcome.ok')?.textContent).toContain('Matched after the change');
    expect(component.report()).toContain('Outcome:   MATCH');
  });

  it('keeps the verdict when the explanation is unavailable', () => {
    calculated('949BBD6013450C7D');
    component.open();
    fixture.detectChanges();
    type('673A05ED91892AF8');
    http.expectOne('/api/operations').flush('down', { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();
    expect(el.querySelector('.outcome.bad')?.textContent).toContain('No match');
    expect(el.textContent).toContain('The cause could not be checked');
  });

  it('closing clears the received value', () => {
    component.open();
    fixture.detectChanges();
    type('949BBD6013450C7D');
    (el.querySelector('.link-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.received()).toBe('');
    expect(el.querySelector('#received')).toBeNull();
  });

  it('offers a link that reopens the same check', () => {
    calculated('949BBD6013450C7D');
    component.open();
    fixture.detectChanges();
    type('949BBD6013450C7D');
    expect(component.link()).toContain('?tag_9f36=0001&received=949BBD6013450C7D');
    expect(component.report()).toContain('Link:');
  });
});
