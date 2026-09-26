import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { TcGenerator } from './tc-generator';

describe('TcGenerator', () => {
  let component: TcGenerator;
  let fixture: ComponentFixture<TcGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TcGenerator);
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
    httpMock.expectNone('/api/tc');
  });

  it('should send a POST to /api/tc with valid input and handle the response', async () => {
    setInputValue('#tag8A', '3030');
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

    const req = httpMock.expectOne('/api/tc');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tag_8a).toBe('3030');
    expect(req.request.body.tag_9f02).toBe('000000010000');
    req.flush({ result: '722699D3734B40C1', type: 'TC', cid: '40' });

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.response.result).toBe('722699D3734B40C1');
    expect(component.response.cid).toBe('40');
  });
});
