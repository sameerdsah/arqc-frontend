import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ArqcGenerator } from './arqc-generator';

describe('ArqcGenerator', () => {
  let component: ArqcGenerator;
  let fixture: ComponentFixture<ArqcGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArqcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ArqcGenerator);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not send an HTTP request when the form is empty/invalid', () => {
    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    httpMock.expectNone('/api/arqc');
  });

  it('should show a required error once a field is touched and left empty', async () => {
    setInputValue('#tag9F02', '1');
    setInputValue('#tag9F02', '');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });

  async function typeAndCheck(selector: string, value: string, message: string) {
    setInputValue(selector, value);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(message);
  }

  it('should require Tag 9F02 to be exactly 12 digits', async () => {
    await typeAndCheck('#tag9F02', '1', 'Please enter a valid amount');
    await typeAndCheck('#tag9F02', '00000001000A', 'Please enter a valid amount');
  });

  it('should require Tag 5F2A to be exactly 4 digits', async () => {
    await typeAndCheck('#tag5F2A', '978', 'Please enter a valid currency code');
    await typeAndCheck('#tag5F2A', '09AB', 'Please enter a valid currency code');
  });

  it('should require Tag 9F10 to be 20-64 hex characters of even length', async () => {
    await typeAndCheck('#tag9F10', '0615', 'Please enter valid issuer application data');
    await typeAndCheck('#tag9F10', '061501020304050607080', 'Please enter valid issuer application data');
  });

  it('should send a POST to /api/arqc with valid input and handle the response', async () => {
    setInputValue('#tag9F02', '000000010000');
    setInputValue('#tag5F2A', '0978');
    setInputValue('#tag9F37', '12345678');
    setInputValue('#tag9F36', '0001');
    setInputValue('#tag9F10', '06150102030405060708');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/arqc');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tag_9f02).toBe('000000010000');
    req.flush({ result: '37858601E2285A5D' });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.response.result).toBe('37858601E2285A5D');
  });

  it('fills the five ARQC fields from pasted chip data and ignores the others', async () => {
    fixture.debugElement.query(By.css('.toggle')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('app-chip-data-paste .link-btn')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.arqcRequest).toEqual({ tag_9f02: '000000010000', tag_5f2a: '0978', tag_9f37: '12345678',
                                            tag_9f36: '0001', tag_9f10: '06150102030405060708' });
    expect(fixture.nativeElement.textContent).toContain('not needed');   // 9F26 / 9F27 are listed but not used
  });
});
