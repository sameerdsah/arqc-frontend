import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { MastercardCvc2Generator } from './cvc2-generator';

describe('MastercardCvc2Generator', () => {
  let fixture: ComponentFixture<MastercardCvc2Generator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastercardCvc2Generator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MastercardCvc2Generator);
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

  it('should show the CVC2 title and full name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CVC2 Generator');
    expect(text).toContain('Card Validation Code 2 (printed on the card)');
  });

  it('should ask for the right fields', () => {
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeNull();
  });

  it('should send a POST to /api/mastercard/cvc2 with valid input and show the result', async () => {
    setInputValue('#pan', '4123456789012345');
    setInputValue('#expiry', '8701');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/mastercard/cvc2');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701' });
    req.flush({ result: '636', type: 'CVC2' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed CVC2 is:');
    expect(fixture.nativeElement.textContent).toContain('636');
  });
});
