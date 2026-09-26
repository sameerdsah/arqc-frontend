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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not send an HTTP request when the form is empty/invalid', () => {
    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    httpMock.expectNone('/api/save');
  });

  it('should show a required error for tag9F02 once touched and left empty', () => {
    const input: HTMLInputElement = fixture.debugElement.query(By.css('#tag9F02')).nativeElement;
    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });

  it('should send a POST to /api/save with valid input and handle the response', () => {
    component.macRequest = {
      tag9F02: '000000010000',
      tag5F2A: '0978',
      tag9F37: '12345678',
      tag9F36: '0001',
      tag9F10: '06150102030405060708'
    };
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/save');
    expect(req.request.method).toBe('POST');
    req.flush({ result: '37858601E2285A5D' });

    fixture.detectChanges();
    expect(component.response.result).toBe('37858601E2285A5D');
  });
});