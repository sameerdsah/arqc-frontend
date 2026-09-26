import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DcvvGenerator } from './dcvv-generator';

describe('DcvvGenerator', () => {
  let fixture: ComponentFixture<DcvvGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DcvvGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(DcvvGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('DCVV Generator');
    expect(text).toContain('Dynamic Card Verification Value');
    expect(text).toContain('Under Maintenance');
  });
});
