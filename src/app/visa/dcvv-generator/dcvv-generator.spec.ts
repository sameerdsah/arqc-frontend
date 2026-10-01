import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisaDcvvGenerator } from './dcvv-generator';

describe('VisaDcvvGenerator', () => {
  let fixture: ComponentFixture<VisaDcvvGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaDcvvGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(VisaDcvvGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('dCVV Generator');
    expect(text).toContain('Dynamic Card Verification Value (contactless)');
    expect(text).toContain('Under Maintenance');
  });
});
