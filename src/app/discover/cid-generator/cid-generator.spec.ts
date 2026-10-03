import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { CidGenerator } from './cid-generator';

describe('Discover CidGenerator', () => {
  let fixture: ComponentFixture<CidGenerator>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CidGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CidGenerator);
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

  it('uses the shared card form with the Discover CID title', () => {
    expect(el.querySelector('app-card-value-generator')).toBeTruthy();
    expect(el.textContent).toContain('CID Generator');
    expect(el.textContent).toContain('Card Identification Number (printed on the card)');
  });

  it('asks for the PAN and expiry only', () => {
    expect(el.querySelector('#pan')).toBeTruthy();
    expect(el.querySelector('#expiry')).toBeTruthy();
    expect(el.querySelector('#serviceCode')).toBeNull();                  // fixed service code, set by the server
  });

  it('fills the Discover test card with "Use example values"', async () => {
    await useExampleValues();
    expect(value('#pan')).toBe('4123456789012345');
    expect(value('#expiry')).toBe('8701');
  });

  it('posts the example card to /api/cid and shows the CID', async () => {
    await useExampleValues();
    await submit();
    const req = httpMock.expectOne('/api/cid');
    expect(req.request.body).toEqual({ pan: '4123456789012345', expiry: '8701' });
    req.flush({ result: '636', type: 'CID' });
    await settle();
    expect(el.textContent).toContain('The computed CID is:');
    expect(el.textContent).toContain('636');
  });
});
