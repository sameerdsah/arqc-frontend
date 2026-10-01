import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { CardValueGenerator, CardValueConfig } from './card-value-generator';

const VISA_CVV: CardValueConfig = {
  title: 'CVV Generator', subtitle: 'Card Verification Value (magnetic stripe)',
  valueName: 'CVV', apiUrl: '/api/visa/cvv', needsServiceCode: true
};
const MASTERCARD_CVC2: CardValueConfig = {
  title: 'CVC2 Generator', subtitle: 'Card Validation Code 2 (printed on the card)',
  valueName: 'CVC2', apiUrl: '/api/mastercard/cvc2', needsServiceCode: false
};

describe('CardValueGenerator', () => {
  let component: CardValueGenerator;
  let fixture: ComponentFixture<CardValueGenerator>;
  let httpMock: HttpTestingController;

  async function create(config: CardValueConfig) {
    fixture = TestBed.createComponent(CardValueGenerator);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardValueGenerator, HttpClientTestingModule],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
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

  it('shows the title and full name from its settings', async () => {
    await create(MASTERCARD_CVC2);
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('CVC2 Generator');
    expect(fixture.nativeElement.textContent).toContain('Card Validation Code 2 (printed on the card)');
  });

  it('asks for a service code only for stripe values', async () => {
    await create(VISA_CVV);
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeTruthy();

    await create(MASTERCARD_CVC2);
    expect(fixture.nativeElement.querySelector('#serviceCode')).toBeNull();
  });

  it('does not send a request when the form is invalid', async () => {
    await create(VISA_CVV);
    await fillAndSubmit({ '#pan': '12345', '#expiry': '8701', '#serviceCode': '101' });
    httpMock.expectNone('/api/visa/cvv');
    expect(fixture.nativeElement.textContent).toContain('Please enter a valid PAN');
  });

  it('posts PAN, expiry and service code to the stripe value endpoint', async () => {
    await create(VISA_CVV);
    await fillAndSubmit({ '#pan': '4123456789012345', '#expiry': '8701', '#serviceCode': '101' });

    const req = httpMock.expectOne('/api/visa/cvv');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701', service_code: '101' });
    req.flush({ result: '561', type: 'CVV' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed CVV is:');
    expect(fixture.nativeElement.textContent).toContain('561');
  });

  it('posts only PAN and expiry for printed values', async () => {
    await create(MASTERCARD_CVC2);
    await fillAndSubmit({ '#pan': '4123456789012345', '#expiry': '8701' });

    const req = httpMock.expectOne('/api/mastercard/cvc2');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701' });
    req.flush({ result: '636', type: 'CVC2' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.response.result).toBe('636');
  });

  it('shows the server error message with the value name', async () => {
    await create(MASTERCARD_CVC2);
    await fillAndSubmit({ '#pan': '4123456789012345', '#expiry': '8701' });

    httpMock.expectOne('/api/mastercard/cvc2')
      .flush({ error: 'PAN must be 13-19 digits' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Unable to calculate the CVC2');
    expect(fixture.nativeElement.textContent).toContain('PAN must be 13-19 digits');
  });
});
