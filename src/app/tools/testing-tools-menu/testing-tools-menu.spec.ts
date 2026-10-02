import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TestingToolsMenu } from './testing-tools-menu';

describe('TestingToolsMenu', () => {
  it('shows the testing tools and opens them', async () => {
    await TestBed.configureTestingModule({
      imports: [TestingToolsMenu],
      providers: [provideRouter([{ path: '**', children: [] }])]
    }).compileComponents();
    const fixture = TestBed.createComponent(TestingToolsMenu);
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.tool-btn')) as HTMLButtonElement[];
    expect(buttons.map(b => b.querySelector('.tool-label')?.textContent)).toEqual(['Verify a Value', 'Batch Generation']);

    buttons[1].click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/tools/batch');
  });
});
