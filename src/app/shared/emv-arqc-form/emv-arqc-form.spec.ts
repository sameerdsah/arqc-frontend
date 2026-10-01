import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { EmvArqcForm, EmvArqcConfig } from './emv-arqc-form';

const CONFIG: EmvArqcConfig = {
  title: 'ARQC Generator', subtitle: 'Authorization Request Cryptogram (9F26)',
  apiUrl: '/api/visa/arqc', iadPattern: '^(?:[0-9A-Fa-f]{2}){7,32}$'
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

  it('shows all 11 EMV fields in CDOL1 order', () => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('label')).map((l: any) => l.textContent.trim());
    expect(labels.length).toBe(11);
    expect(labels[0]).toContain('9F02');
    expect(labels[3]).toContain('Tag 95');
    expect(labels[10]).toContain('9F10');
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
});
