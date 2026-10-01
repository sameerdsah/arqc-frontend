import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MastercardArpcGenerator } from './arpc-generator';

describe('MastercardArpcGenerator', () => {
  let fixture: ComponentFixture<MastercardArpcGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastercardArpcGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(MastercardArpcGenerator);
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
