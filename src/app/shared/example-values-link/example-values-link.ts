import { Component, output } from '@angular/core';

/**
 * "Use example values" link shown at the top of every form. The form decides what the
 * example values are (the documented test values, which give the documented results).
 */
@Component({
  selector: 'app-example-values-link',
  template: `<button type="button" class="example-link" (click)="use.emit()">Use example values</button>`,
  styles: [`
    :host { display: block; text-align: right; margin: -4px 0 6px; }
    .example-link { background: none; border: none; padding: 0; width: auto; cursor: pointer;
                    color: #1976d2; font-size: 0.9rem; }
    .example-link:hover, .example-link:focus-visible { text-decoration: underline; background: none; }
  `]
})
export class ExampleValuesLink {
  readonly use = output<void>();
}
