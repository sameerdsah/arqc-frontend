import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { IcvvGenerator } from './icvv-generator';

describe('IcvvGenerator', () => {
  let component: IcvvGenerator;
  let fixture: ComponentFixture<IcvvGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcvvGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(IcvvGenerator);
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
    httpMock.expectNone('/api/icvv');
  });

  it('should show a required error once a field is touched and left empty', async () => {
    setInputValue('#pan', '1');
    setInputValue('#pan', '');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });

  it('should send a POST to /api/icvv with valid input and handle the response', async () => {
    setInputValue('#pan', '4123456789012345');
    setInputValue('#expiry', '8701');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/icvv');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.pan).toBe('4123456789012345');
    req.flush({ result: '651' });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.response.result).toBe('651');
  });
});
