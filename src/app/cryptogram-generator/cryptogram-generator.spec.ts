import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { CryptogramGenerator } from './cryptogram-generator';

describe('CryptogramGenerator', () => {
  let component: CryptogramGenerator;
  let fixture: ComponentFixture<CryptogramGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptogramGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CryptogramGenerator);
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
    httpMock.expectNone('/api/save');
  });

  it('should show a required error for tag9F02 once touched and left empty', async () => {
    setInputValue('#tag9F02', '1');
    setInputValue('#tag9F02', '');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });

  it('should send a POST to /api/save with valid input and handle the response', async () => {
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

    const req = httpMock.expectOne('/api/save');
    expect(req.request.method).toBe('POST');
    req.flush({ result: '37858601E2285A5D' });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.response.result).toBe('37858601E2285A5D');
  });
});