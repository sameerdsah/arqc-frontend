import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { AmexArpcGenerator } from './arpc-generator';

describe('AmexArpcGenerator', () => {
  let fixture: ComponentFixture<AmexArpcGenerator>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmexArpcGenerator, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AmexArpcGenerator);
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

  it('should show the ARPC title and method', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('ARPC Generator');
    expect(text).toContain('EMV Method 1');
  });

  it('should send a POST to /api/amex/arpc and show the result', async () => {
    setInputValue('#arqc', '37858601E2285A5D');
    setInputValue('#tag8A', '3030');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/amex/arpc');
    expect(req.request.body).toEqual({ arqc: '37858601E2285A5D', tag_8a: '3030' });
    req.flush({ result: 'C837D13061C1E896', type: 'ARPC' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('C837D13061C1E896');
  });
});
