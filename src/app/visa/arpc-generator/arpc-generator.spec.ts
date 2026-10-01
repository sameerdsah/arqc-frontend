import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisaArpcGenerator } from './arpc-generator';

describe('VisaArpcGenerator', () => {
  let fixture: ComponentFixture<VisaArpcGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaArpcGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(VisaArpcGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('ARPC Generator');
    expect(text).toContain('Authorization Response Cryptogram');
    expect(text).toContain('Under Maintenance');
  });
});
