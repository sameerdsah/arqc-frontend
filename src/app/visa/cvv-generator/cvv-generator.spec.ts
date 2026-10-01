import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { VisaCvvGenerator } from './cvv-generator';

describe('VisaCvvGenerator', () => {
  let fixture: ComponentFixture<VisaCvvGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaCvvGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(VisaCvvGenerator);
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

  it('should show the CVV title and full name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CVV Generator');
    expect(text).toContain('Card Verification Value (magnetic stripe)');
  });

  it('should ask for the right fields', () => {
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeTruthy();
  });

  it('should send a POST to /api/visa/cvv with valid input and show the result', async () => {
    setInputValue('#pan', '4123456789012345');
    setInputValue('#expiry', '8701');
    setInputValue('#serviceCode', '101');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/visa/cvv');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701', service_code: '101' });
    req.flush({ result: '561', type: 'CVV' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed CVV is:');
    expect(fixture.nativeElement.textContent).toContain('561');
  });
});
