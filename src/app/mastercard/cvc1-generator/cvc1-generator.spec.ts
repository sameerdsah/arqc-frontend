import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { MastercardCvc1Generator } from './cvc1-generator';

describe('MastercardCvc1Generator', () => {
  let fixture: ComponentFixture<MastercardCvc1Generator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastercardCvc1Generator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MastercardCvc1Generator);
    httpMock = TestBed.inject(HttpTestingController);
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

  it('should show the CVC1 title and full name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CVC1 Generator');
    expect(text).toContain('Card Validation Code 1 (magnetic stripe)');
  });

  it('should ask for the right fields', () => {
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeTruthy();
  });

  it('should send a POST to /api/mastercard/cvc1 with valid input and show the result', async () => {
    setInputValue('#pan', '4123456789012345');
    setInputValue('#expiry', '8701');
    setInputValue('#serviceCode', '101');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/mastercard/cvc1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701', service_code: '101' });
    req.flush({ result: '561', type: 'CVC1' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed CVC1 is:');
    expect(fixture.nativeElement.textContent).toContain('561');
  });
});
