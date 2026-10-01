import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MastercardCvc3Generator } from './cvc3-generator';

describe('MastercardCvc3Generator', () => {
  let fixture: ComponentFixture<MastercardCvc3Generator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastercardCvc3Generator],
    }).compileComponents();

    fixture = TestBed.createComponent(MastercardCvc3Generator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CVC3 Generator');
    expect(text).toContain('Dynamic Card Validation Code (contactless)');
    expect(text).toContain('Under Maintenance');
  });
});
