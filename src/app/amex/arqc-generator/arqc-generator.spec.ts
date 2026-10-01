import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmexArqcGenerator } from './arqc-generator';

describe('AmexArqcGenerator', () => {
  let fixture: ComponentFixture<AmexArqcGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmexArqcGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(AmexArqcGenerator);
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
