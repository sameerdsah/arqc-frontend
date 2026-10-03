import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ArqcGenerator } from './arqc-generator';

describe('Discover ArqcGenerator', () => {
  let fixture: ComponentFixture<ArqcGenerator>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArqcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ArqcGenerator);
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

  const DISCOVER_BODY = { tag_9f02: '000000010000', tag_5f2a: '0978', tag_9f37: '12345678',
                          tag_9f36: '0001', tag_9f10: '06150102030405060708' };

  it('uses the shared ARQC form with the five Discover tags and no groups', () => {
    expect(el.querySelector('app-emv-arqc-form')).toBeTruthy();
    const labels = Array.from(el.querySelectorAll('label')).map(l => l.textContent ?? '').filter(t => t.startsWith('Tag'));
    expect(labels.map(l => l.split(' ')[1])).toEqual(['9F02', '5F2A', '9F37', '9F36', '9F10']);
    expect(el.querySelector('.section-head')).toBeNull();
  });

  it('posts the example values to /api/arqc and shows the ARQC', async () => {
    await useExampleValues();
    await submit();
    const req = httpMock.expectOne('/api/arqc');
    expect(req.request.body).toEqual(DISCOVER_BODY);
    req.flush({ result: '37858601E2285A5D', type: 'ARQC' });
    await settle();
    expect(el.textContent).toContain('The computed ARQC is:');
    expect(el.textContent).toContain('37858601E2285A5D');
  });

  it('requires Tag 9F10 to be 20-64 hex characters (Discover rule)', async () => {
    await useExampleValues();
    const input = el.querySelector('#tag9F10') as HTMLInputElement;
    input.value = '0615010203';                                       // 10 characters: too short for Discover
    input.dispatchEvent(new Event('input'));
    await submit();
    httpMock.expectNone('/api/arqc');
    expect(el.textContent).toContain('Please enter valid issuer application data');
  });

  it('fills the five fields from the example chip data', async () => {
    (el.querySelector('app-chip-data-paste .toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('app-chip-data-paste .link-btn') as HTMLButtonElement).click();
    await settle();
    expect(['#tag9F02', '#tag5F2A', '#tag9F37', '#tag9F36', '#tag9F10'].map(value))
      .toEqual(['000000010000', '0978', '12345678', '0001', '06150102030405060708']);
  });
});
