import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { VisaCvv2Generator } from './cvv2-generator';

describe('VisaCvv2Generator', () => {
  let fixture: ComponentFixture<VisaCvv2Generator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaCvv2Generator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(VisaCvv2Generator);
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

  it('should show the CVV2 title and full name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CVV2 Generator');
    expect(text).toContain('Card Verification Value 2 (printed on the card)');
  });

  it('should ask for the right fields', () => {
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeNull();
  });

  it('should send a POST to /api/visa/cvv2 with valid input and show the result', async () => {
    setInputValue('#pan', '4123456789012345');
    setInputValue('#expiry', '8701');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/visa/cvv2');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701' });
    req.flush({ result: '636', type: 'CVV2' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed CVV2 is:');
    expect(fixture.nativeElement.textContent).toContain('636');
  });
});
