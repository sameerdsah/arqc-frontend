import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisaArqcGenerator } from './arqc-generator';

describe('VisaArqcGenerator', () => {
  let fixture: ComponentFixture<VisaArqcGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaArqcGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(VisaArqcGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('ARQC Generator');
    expect(text).toContain('Authorization Request Cryptogram (9F26)');
    expect(text).toContain('Under Maintenance');
  });
});
