import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { MastercardChipCvcGenerator } from './chip-cvc-generator';

describe('MastercardChipCvcGenerator', () => {
  let fixture: ComponentFixture<MastercardChipCvcGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastercardChipCvcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MastercardChipCvcGenerator);
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

  it('should show the Chip CVC title and full name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Chip CVC Generator');
    expect(text).toContain('Chip Card Validation Code (stored in the chip)');
  });

  it('should ask for the right fields', () => {
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeNull();
  });

  it('should send a POST to /api/mastercard/chip-cvc with valid input and show the result', async () => {
    setInputValue('#pan', '4123456789012345');
    setInputValue('#expiry', '8701');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/mastercard/chip-cvc');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701' });
    req.flush({ result: '651', type: 'Chip CVC' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed Chip CVC is:');
    expect(fixture.nativeElement.textContent).toContain('651');
  });
});
