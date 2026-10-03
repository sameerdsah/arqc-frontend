import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ArpcGenerator } from './arpc-generator';

describe('Discover ArpcGenerator', () => {
  let fixture: ComponentFixture<ArpcGenerator>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArpcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ArpcGenerator);
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

  it('uses the shared ARPC form with the Discover title', () => {
    expect(el.querySelector('app-arpc-form')).toBeTruthy();
    expect(el.textContent).toContain('ARPC Generator');
    expect(el.textContent).toContain('EMV Method 1');
  });

  it('posts the example values to /api/arpc and shows the ARPC', async () => {
    await useExampleValues();
    await submit();
    const req = httpMock.expectOne('/api/arpc');
    expect(req.request.body).toEqual({ arqc: '37858601E2285A5D', tag_8a: '3030' });
    req.flush({ result: 'C837D13061C1E896', type: 'ARPC' });
    await settle();
    expect(el.textContent).toContain('The computed ARPC is:');
    expect(el.textContent).toContain('C837D13061C1E896');
  });

  it('fills the ARQC (9F26) and the response code (8A) from the example chip data', async () => {
    (el.querySelector('app-chip-data-paste .toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('app-chip-data-paste .link-btn') as HTMLButtonElement).click();
    await settle();
    expect(value('#arqc')).toBe('37858601E2285A5D');
    expect(value('#tag8A')).toBe('3030');
  });
});
