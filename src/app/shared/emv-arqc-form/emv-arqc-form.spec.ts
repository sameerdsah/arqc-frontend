import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { EmvArqcForm, EmvArqcConfig, fullEmvDataSet } from './emv-arqc-form';

const CONFIG: EmvArqcConfig = {
  title: 'ARQC Generator', subtitle: 'Authorization Request Cryptogram (9F26)', apiUrl: '/api/visa/arqc',
  fields: fullEmvDataSet({ iadPattern: '^(?:[0-9A-Fa-f]{2}){7,32}$', aip: '3C00', exampleIad: '06010A03A00000' })
};

const VALID_ARQC_INPUT: Record<string, string> = {
  '#tag9F02': '000000010000', '#tag9F03': '000000000000', '#tag9F1A': '0826',
  '#tag95': '0000000000', '#tag5F2A': '0826', '#tag9A': '261001', '#tag9C': '00',
  '#tag9F37': '12345678', '#tag82': '3C00', '#tag9F36': '0001', '#tag9F10': '06010A03A00000'
};

describe('EmvArqcForm', () => {
  let component: EmvArqcForm;
  let fixture: ComponentFixture<EmvArqcForm>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmvArqcForm, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EmvArqcForm);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('config', CONFIG);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function setInputValue(selector: string, value: string) {
    const input: HTMLInputElement = fixture.debugElement.query(By.css(selector)).nativeElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function fillAndSubmit(values: Record<string, string>) {
    for (const [selector, value] of Object.entries(values)) {
      setInputValue(selector, value);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function value(selector: string): string {
    return (fixture.nativeElement.querySelector(selector) as HTMLInputElement).value;
  }

  it('shows all 11 EMV fields: transaction data first, then terminal and card data', () => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('label')).map((l: any) => l.textContent.trim());
    expect(labels.length).toBe(11);
    expect(labels.slice(0, 4).map(l => l.split(' ')[1])).toEqual(['9F02', '9F37', '9F36', '9F10']);
    expect(labels[4]).toContain('9F03');
    const headings = Array.from(fixture.nativeElement.querySelectorAll('.section-head span')).map((h: any) => h.textContent.trim());
    expect(headings).toEqual(['Transaction data', 'Terminal and card data']);
  });

  it('starts with every field empty', () => {
    for (const id of ['#tag9F02', '#tag9F10', '#tag9F03', '#tag9F1A', '#tag9A', '#tag82']) {
      expect(value(id)).toBe('');
    }
  });

  it('fills all fields with the documented example values', async () => {
    (fixture.nativeElement.querySelector('app-example-values-link button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(value('#tag9A')).toBe('261001');
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/visa/arqc');
    expect(req.request.body).toEqual({
      tag_9f02: '000000010000', tag_9f37: '12345678', tag_9f36: '0001', tag_9f10: '06010A03A00000',
      tag_9f03: '000000000000', tag_9f1a: '0826', tag_95: '0000000000', tag_5f2a: '0826',
      tag_9a: '261001', tag_9c: '00', tag_82: '3C00'
    });
    req.flush({ result: '949BBD6013450C7D', type: 'ARQC' });
  });

  it('does not send a request when a field has the wrong format', async () => {
    await fillAndSubmit({ ...VALID_ARQC_INPUT, '#tag9A': '261341' });
    httpMock.expectNone('/api/visa/arqc');
    expect(fixture.nativeElement.textContent).toContain('Please enter a valid date');
  });

  it('posts all fields to the configured endpoint and shows the ARQC', async () => {
    await fillAndSubmit(VALID_ARQC_INPUT);
    const req = httpMock.expectOne('/api/visa/arqc');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tag_9f1a).toBe('0826');
    expect(req.request.body.tag_9f10).toBe('06010A03A00000');
    expect(Object.keys(req.request.body).length).toBe(11);
    req.flush({ result: '949BBD6013450C7D', type: 'ARQC', cvn: '0A' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed ARQC is:');
    expect(component.response.result).toBe('949BBD6013450C7D');
  });

  it('shows the server error message', async () => {
    await fillAndSubmit(VALID_ARQC_INPUT);
    httpMock.expectOne('/api/visa/arqc')
      .flush({ error: 'Unsupported Visa CVN: 11' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Unable to calculate the ARQC');
    expect(fixture.nativeElement.textContent).toContain('Unsupported Visa CVN: 11');
  });

  it('fills the form from pasted chip data (field 55)', async () => {
    fixture.debugElement.query(By.css('.toggle')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('app-chip-data-paste .link-btn')).nativeElement.click();   // Use example chip data
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(value('#tag9F37')).toBe('12345678');
    expect(value('#tag9F10')).toBe('06010A03A00000');
    expect(value('#tag9A')).toBe('261001');
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/visa/arqc');
    expect(req.request.body.tag_9f02).toBe('000000010000');
    req.flush({ result: '949BBD6013450C7D', type: 'ARQC' });
  });

  it('compares a received ARQC, explains the mismatch and fixes it in one click', async () => {
    component.received = '673A05ED91892AF8';            // the card's ARQC, e.g. from a terminal log
    await fillAndSubmit(VALID_ARQC_INPUT);
    httpMock.expectOne('/api/visa/arqc').flush({ result: '949BBD6013450C7D', type: 'ARQC' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.outcome.bad')?.textContent).toContain('No match');

    httpMock.expectOne('/api/operations').flush({ max_batch_items: 500, operations: [
      { id: 'visa/arqc', path: '/api/visa/arqc', network: 'visa', network_label: 'Visa', label: 'Visa ARQC', type: 'ARQC',
        result_format: '16 hex characters', result_pattern: '^[0-9A-F]{16}$', fields: [] }] });
    const verify = httpMock.expectOne('/api/verify');
    expect(verify.request.body.input.tag_9f36).toBe('0001');
    verify.flush({ operation: 'visa/arqc', type: 'ARQC', valid: false, expected: '949BBD6013450C7D', received: '673A05ED91892AF8',
                   diagnosis: { checked: 1, findings: [{ cause: 'atc-drift', confidence: 'certain',
                     explanation: 'The received cryptogram belongs to a later transaction.',
                     changes: [{ field: 'tag_9f36', label: 'Tag 9F36 (Application Transaction Counter)', from: '0001', to: '0002' }] }] } });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.apply-btn').click();
    fixture.detectChanges();

    const again = httpMock.expectOne('/api/visa/arqc');
    expect(again.request.body.tag_9f36).toBe('0002');
    again.flush({ result: '673A05ED91892AF8', type: 'ARQC' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.outcome.ok')?.textContent).toContain('Matched after the change');
    expect(component.arqcRequest['tag_9f36']).toBe('0002');
  });

  it('takes the received ARQC from the chip data (9F26) when the page has an example ARQC', async () => {
    fixture.componentRef.setInput('config', { ...CONFIG, exampleResult: '949BBD6013450C7D' });
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.toggle')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('app-chip-data-paste .link-btn')).nativeElement.click();
    fixture.detectChanges();
    expect(component.received).toBe('949BBD6013450C7D');
    expect(component.arqcRequest['arqc']).toBeUndefined();
  });
});
