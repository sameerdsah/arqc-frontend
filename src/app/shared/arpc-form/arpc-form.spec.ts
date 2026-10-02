import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ArpcForm, ArpcConfig } from './arpc-form';

const CONFIG: ArpcConfig = {
  title: 'ARPC Generator', subtitle: 'Authorization Response Cryptogram', apiUrl: '/api/mastercard/arpc'
};

describe('ArpcForm', () => {
  let component: ArpcForm;
  let fixture: ComponentFixture<ArpcForm>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArpcForm, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ArpcForm);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('config', CONFIG);
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

  async function fillAndSubmit(arqc: string, arc: string) {
    setInputValue('#arqc', arqc);
    setInputValue('#tag8A', arc);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows the title from its settings', () => {
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('ARPC Generator');
  });

  it('rejects an ARQC that is not 16 hex characters', async () => {
    await fillAndSubmit('12345', '3030');
    httpMock.expectNone('/api/mastercard/arpc');
    expect(fixture.nativeElement.textContent).toContain('Please enter a valid ARQC');
  });

  it('posts the ARQC and response code to the configured endpoint', async () => {
    await fillAndSubmit('37858601E2285A5D', '3030');
    const req = httpMock.expectOne('/api/mastercard/arpc');
    expect(req.request.body).toEqual({ arqc: '37858601E2285A5D', tag_8a: '3030' });
    req.flush({ result: 'C837D13061C1E896', type: 'ARPC' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The computed ARPC is:');
    expect(component.response.result).toBe('C837D13061C1E896');
  });

  it('fills the documented example values with "Use example values"', async () => {
    fixture.nativeElement.querySelector('app-example-values-link button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.arpcRequest).toEqual({ arqc: '37858601E2285A5D', tag_8a: '3030' });
  });

  it('takes the ARQC from tag 9F26 of pasted chip data and leaves the response code to type in', async () => {
    component.arpcRequest = { arqc: '', tag_8a: '3030' };
    fixture.debugElement.query(By.css('.toggle')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('app-chip-data-paste .link-btn')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.arpcRequest).toEqual({ arqc: '37858601E2285A5D', tag_8a: '3030' });
  });
});
