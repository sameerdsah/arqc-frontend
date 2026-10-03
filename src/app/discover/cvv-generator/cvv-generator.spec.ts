import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { CvvGenerator } from './cvv-generator';

describe('Discover CvvGenerator', () => {
  let fixture: ComponentFixture<CvvGenerator>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvvGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CvvGenerator);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    httpMock.verify();
  });

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function value(selector: string): string {
    return (el.querySelector(selector) as HTMLInputElement).value;
  }

  async function submit() {
    await settle();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  async function useExampleValues() {
    (el.querySelector('app-example-values-link button') as HTMLButtonElement).click();
    await settle();
  }

  it('uses the shared card form with the Discover CVV title', () => {
    expect(el.querySelector('app-card-value-generator')).toBeTruthy();
    expect(el.textContent).toContain('CVV Generator');
    expect(el.textContent).toContain('Card Verification Value');
  });

  it('asks for the PAN and expiry and the service code', () => {
    expect(el.querySelector('#pan')).toBeTruthy();
    expect(el.querySelector('#expiry')).toBeTruthy();
    expect(el.querySelector('#serviceCode')).toBeTruthy();                // magnetic stripe value
  });

  it('fills the Discover test card with "Use example values"', async () => {
    await useExampleValues();
    expect(value('#pan')).toBe('4123456789012345');
    expect(value('#expiry')).toBe('8701');
    expect(value('#serviceCode')).toBe('101');
  });

  it('posts the example card to /api/cvv and shows the CVV', async () => {
    await useExampleValues();
    await submit();
    const req = httpMock.expectOne('/api/cvv');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701', service_code: '101' });
    req.flush({ result: '561', type: 'CVV' });
    await settle();
    expect(el.textContent).toContain('The computed CVV is:');
    expect(el.textContent).toContain('561');
  });
});
