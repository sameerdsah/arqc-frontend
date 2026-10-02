import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ArpcGenerator } from './arpc-generator';

describe('ArpcGenerator', () => {
  let component: ArpcGenerator;
  let fixture: ComponentFixture<ArpcGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArpcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ArpcGenerator);
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
    httpMock.expectNone('/api/arpc');
  });

  it('should show a required error once a field is touched and left empty', async () => {
    setInputValue('#arqc', '1');
    setInputValue('#arqc', '');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });

  it('should reject an ARQC that is not 16 hex characters', async () => {
    setInputValue('#arqc', '12345');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Please enter a valid ARQC');
  });

  it('should send a POST to /api/arpc with valid input and handle the response', async () => {
    setInputValue('#arqc', '37858601E2285A5D');
    setInputValue('#tag8A', '3030');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/arpc');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.arqc).toBe('37858601E2285A5D');
    expect(req.request.body.tag_8a).toBe('3030');
    req.flush({ result: 'C837D13061C1E896' });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.response.result).toBe('C837D13061C1E896');
  });

  it('fills the documented example values with "Use example values"', async () => {
    fixture.nativeElement.querySelector('app-example-values-link button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.arpcRequest).toEqual({ arqc: '37858601E2285A5D', tag_8a: '3030' });
  });
});
