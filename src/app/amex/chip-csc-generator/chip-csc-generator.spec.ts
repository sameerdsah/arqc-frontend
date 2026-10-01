import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmexChipCscGenerator } from './chip-csc-generator';

describe('AmexChipCscGenerator', () => {
  let fixture: ComponentFixture<AmexChipCscGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmexChipCscGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(AmexChipCscGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Chip CSC Generator');
    expect(text).toContain('Chip Card Security Code (stored in the chip)');
    expect(text).toContain('Under Maintenance');
  });
});
