import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmexCidGenerator } from './cid-generator';

describe('AmexCidGenerator', () => {
  let fixture: ComponentFixture<AmexCidGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmexCidGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(AmexCidGenerator);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the full name and Under Maintenance', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CID Generator');
    expect(text).toContain('Card Identification Number (4 digits, printed on the front)');
    expect(text).toContain('Under Maintenance');
  });
});
