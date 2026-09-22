import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArqcGenerator } from './arqc-generator';

describe('ArqcGenerator', () => {
  let component: ArqcGenerator;
  let fixture: ComponentFixture<ArqcGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArqcGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(ArqcGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});