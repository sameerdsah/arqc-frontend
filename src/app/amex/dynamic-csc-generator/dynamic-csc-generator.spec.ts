import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmexDynamicCscGenerator } from './dynamic-csc-generator';

describe('AmexDynamicCscGenerator', () => {
  let fixture: ComponentFixture<AmexDynamicCscGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmexDynamicCscGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(AmexDynamicCscGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Dynamic CSC Generator');
    expect(text).toContain('Expresspay dynamic value (contactless)');
    expect(text).toContain('Under Maintenance');
  });
});
