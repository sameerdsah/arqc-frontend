import { Component, computed, input, output, signal } from '@angular/core';
import { DiagnosisFinding, Explanation } from '../../core/operations/operations.models';
import { compareChars, findingOf, IDLE } from '../../core/operations/value-check';

/**
 * The outcome of checking a received value: Match / No match, the differing characters and,
 * for a mismatch, the most likely cause with a one-click fix. Presentational only: the page
 * decides what "apply" does and where the explanation comes from.
 *
 *   <app-check-outcome type="ARQC" [expected]="..." [received]="..." [explanation]="..."
 *                      [report]="..." (apply)="applyFinding($event)" />
 */
@Component({
  selector: 'app-check-outcome',
  templateUrl: './check-outcome.html',
  styleUrl: './check-outcome.css'
})
export class CheckOutcome {
  readonly type = input.required<string>();
  readonly expected = input.required<string>();
  readonly received = input.required<string>();
  readonly explanation = input<Explanation>(IDLE);
  /** The finding that was just applied: a match is then shown as "matched after the change". */
  readonly applied = input<DiagnosisFinding | null>(null);
  /** Plain-text summary for "Copy check report". */
  readonly report = input('');
  /** The user chose to apply a finding (change the input, or switch to the other value). */
  readonly apply = output<DiagnosisFinding>();

  readonly match = computed(() => this.expected() === this.received());
  readonly diff = computed(() => compareChars(this.expected(), this.received()));
  readonly differing = computed(() => this.diff().filter(c => !c.same).length);
  readonly finding = computed(() => findingOf(this.explanation()));
  readonly checked = computed(() => {
    const e = this.explanation();
    return e.status === 'done' ? e.diagnosis.checked : 0;
  });

  private readonly copiedReport = signal<string | null>(null);
  readonly copied = computed(() => this.copiedReport() === this.report());
  readonly copyBlocked = signal(false);

  actionLabel(finding: DiagnosisFinding): string | null {
    if (finding.operation) {
      return `Switch to ${finding.operation.label}`;
    }
    return finding.changes.length ? 'Apply this change and check again' : null;
  }

  /** Copies the report; when the browser blocks the clipboard the text is shown to select instead. */
  async copy() {
    const text = this.report();
    try {
      await navigator.clipboard.writeText(text);
      this.copiedReport.set(text);
      this.copyBlocked.set(false);
    } catch {
      this.copyBlocked.set(true);
    }
  }
}
