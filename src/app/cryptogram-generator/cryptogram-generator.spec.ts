import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CryptogramGenerator } from './cryptogram-generator';

describe('CryptogramGenerator', () => {
  let component: CryptogramGenerator;
  let fixture: ComponentFixture<CryptogramGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptogramGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(CryptogramGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});