import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { VisaArqcGenerator } from './arqc-generator';

const VALID_ARQC_INPUT: Record<string, string> = {
  '#tag9F02': '000000010000', '#tag9F03': '000000000000', '#tag9F1A': '0826',
  '#tag95': '0000000000', '#tag5F2A': '0826', '#tag9A': '261001', '#tag9C': '00',
  '#tag9F37': '12345678', '#tag82': '3C00', '#tag9F36': '0001', '#tag9F10': '06010A03A00000'
};

describe('VisaArqcGenerator', () => {
  let fixture: ComponentFixture<VisaArqcGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaArqcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(VisaArqcGenerator);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show the Visa ARQC title', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('ARQC Generator');
    expect(text).toContain('Visa CVN 10 / CVN 18');
  });

  it('should send the EMV data to /api/visa/arqc and show the result', async () => {
    const values = { ...VALID_ARQC_INPUT, '#tag82': '3C00', '#tag9F10': '06010A03A00000' };
    for (const [selector, value] of Object.entries(values)) {
      const input: HTMLInputElement = fixture.debugElement.query(By.css(selector)).nativeElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/visa/arqc');
    expect(req.request.body.tag_9f10).toBe('06010A03A00000');
    req.flush({ result: '949BBD6013450C7D', type: 'ARQC' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('949BBD6013450C7D');
  });
});
