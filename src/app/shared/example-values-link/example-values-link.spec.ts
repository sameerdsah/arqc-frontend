import { TestBed } from '@angular/core/testing';
import { ExampleValuesLink } from './example-values-link';

describe('ExampleValuesLink', () => {
  it('emits when clicked', async () => {
    await TestBed.configureTestingModule({ imports: [ExampleValuesLink] }).compileComponents();
    const fixture = TestBed.createComponent(ExampleValuesLink);
    let clicks = 0;
    fixture.componentInstance.use.subscribe(() => clicks++);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Use example values');
    button.click();
    expect(clicks).toBe(1);
  });
});
