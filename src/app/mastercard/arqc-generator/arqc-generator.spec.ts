import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MastercardArqcGenerator } from './arqc-generator';

describe('MastercardArqcGenerator', () => {
  let fixture: ComponentFixture<MastercardArqcGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastercardArqcGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(MastercardArqcGenerator);
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
