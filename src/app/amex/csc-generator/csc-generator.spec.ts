import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmexCscGenerator } from './csc-generator';

describe('AmexCscGenerator', () => {
  let fixture: ComponentFixture<AmexCscGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmexCscGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(AmexCscGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CSC Generator');
    expect(text).toContain('Card Security Code (magnetic stripe)');
    expect(text).toContain('Under Maintenance');
  });
});
