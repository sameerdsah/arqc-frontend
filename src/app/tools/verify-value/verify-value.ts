import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { OperationsService } from '../../core/operations/operations.service';
import {
  DiagnosisFinding, Explanation, groupByNetwork, OperationGroup, OperationInfo, VerifyResult
} from '../../core/operations/operations.models';
import { changesOf, checkReport, IDLE, isApplied } from '../../core/operations/value-check';
import { friendlyErrorMessage } from '../../shared/api-error';
import { ChipDataPaste } from '../../shared/chip-data-paste/chip-data-paste';
import { CheckOutcome } from '../../shared/check-outcome/check-outcome';
import { exampleChipData } from '../../core/emv/chip-examples';

export { compareChars } from '../../core/operations/value-check';
export type { DiffChar } from '../../core/operations/value-check';

/**
 * Verify a value received from a card, terminal or simulator (ARQC, ARPC, CVV ...).
 * The form is built from the operation catalogue, so it works for every value the API offers.
 * A mismatch is explained by the Mismatch Explainer: the most likely cause, applied in one click.
 */
@Component({
  selector: 'app-verify-value',
  imports: [ChipDataPaste, CheckOutcome],
  templateUrl: './verify-value.html',
  styleUrl: './verify-value.css'
})
export class VerifyValue {
  private readonly api = inject(OperationsService);

  readonly operations = signal<OperationInfo[]>([]);
  readonly groups = signal<OperationGroup[]>([]);
  readonly loadError = signal<string | null>(null);

  readonly selectedId = signal('');
  readonly selected = computed(() => this.operations().find(op => op.id === this.selectedId()) ?? null);
  readonly values = signal<Record<string, string>>({});
  readonly received = signal('');

  readonly submitted = signal(false);
  readonly busy = signal(false);
  readonly result = signal<VerifyResult | null>(null);
  readonly error = signal<string | null>(null);

  readonly missingFields = computed(() =>
    (this.selected()?.fields ?? []).filter(f => !(this.values()[f.name] ?? '').trim()).map(f => f.name));
  readonly receivedInvalid = computed(() => {
    const op = this.selected();
    const value = this.received().trim();
    return !!op && !!value && !new RegExp(op.result_pattern, 'i').test(value);
  });
  readonly canVerify = computed(() =>
    !!this.selected() && !this.missingFields().length && !!this.received().trim() && !this.receivedInvalid());
  /** Chip data can fill the inputs and, for ARQC / ARPC, the received value (9F26 / 91). */
  readonly receivedKey = computed(() => {
    const type = this.selected()?.type;
    return type === 'ARQC' ? 'arqc' : type === 'ARPC' ? 'arpc' : null;
  });
  readonly chipTargets = computed(() => {
    const op = this.selected();
    const key = this.receivedKey();
    return op ? [...op.fields.map(f => f.name), ...(key ? [key] : [])] : [];
  });
  readonly exampleChip = computed(() => {
    const op = this.selected();
    return op ? exampleChipData(op) : '';
  });
  /** The explanation the API returned with a mismatch. */
  readonly explanation = computed<Explanation>(() => {
    const r = this.result();
    return r && !r.valid && r.diagnosis ? { status: 'done', diagnosis: r.diagnosis } : IDLE;
  });
  private readonly appliedFinding = signal<DiagnosisFinding | null>(null);
  readonly applied = computed(() => {
    const finding = this.appliedFinding();
    return this.result()?.valid && isApplied(finding, this.values()) ? finding : null;
  });
  readonly report = computed(() => {
    const r = this.result();
    const op = this.selected();
    return r && op ? checkReport({ value: `${op.label} (${op.id})`, input: this.input(op), expected: r.expected,
                                   received: r.received, explanation: this.explanation() }) : '';
  });

  constructor() {
    this.api.catalogue$.pipe(takeUntilDestroyed()).subscribe({
      next: catalogue => {
        this.operations.set(catalogue.operations);
        this.groups.set(groupByNetwork(catalogue.operations));
        if (!this.selectedId() && catalogue.operations.length) {
          this.selectedId.set(catalogue.operations[0].id);
        }
      },
      error: err => this.loadError.set(friendlyErrorMessage(err))
    });
  }

  select(id: string) {
    this.selectedId.set(id);
    this.values.set({});
    this.received.set('');
    this.submitted.set(false);
    this.clearOutcome();
  }

  setValue(name: string, value: string) {
    this.values.update(v => ({ ...v, [name]: value }));
    this.clearOutcome();
  }

  setReceived(value: string) {
    this.received.set(value);
    this.clearOutcome();
  }

  /**
   * Applies the Mismatch Explainer's finding and verifies again: either the input changes
   * (e.g. 9F36 0001 -> 0002) or another value of the same card (e.g. the CID, not the CVV),
   * keeping the inputs and the received value.
   */
  applyFinding(finding: DiagnosisFinding) {
    if (finding.operation) {
      const target = this.operations().find(op => op.id === finding.operation!.id);
      if (!target) {
        return;
      }
      const keep = new Set(target.fields.map(f => f.name));
      this.selectedId.set(target.id);
      this.values.update(v => Object.fromEntries(Object.entries(v).filter(([name]) => keep.has(name))));
    } else {
      this.values.update(v => ({ ...v, ...changesOf(finding) }));
    }
    this.verify();
    this.appliedFinding.set(finding);
  }

  useExampleValues() {
    const op = this.selected();
    if (op) {
      this.values.set(Object.fromEntries(op.fields.map(f => [f.name, f.example])));
      this.clearOutcome();
    }
  }

  applyChipData(chip: Record<string, string>) {
    const op = this.selected();
    if (!op) {
      return;
    }
    const names = new Set(op.fields.map(f => f.name));
    this.values.update(v => ({ ...v, ...Object.fromEntries(Object.entries(chip).filter(([name]) => names.has(name))) }));
    const key = this.receivedKey();
    if (key && chip[key]) {
      this.received.set(chip[key]);
    }
    this.clearOutcome();
  }

  isMissing(name: string): boolean {
    return this.submitted() && this.missingFields().includes(name);
  }

  verify() {
    this.submitted.set(true);
    const op = this.selected();
    if (!op || !this.canVerify() || this.busy()) {
      return;
    }
    this.clearOutcome();
    this.busy.set(true);
    this.api.verify({ operation: op.id, input: this.input(op), received: this.received().trim(), diagnose: true })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: result => this.result.set(result),
        error: err => this.error.set(friendlyErrorMessage(err))
      });
  }

  private input(op: OperationInfo): Record<string, string> {
    return Object.fromEntries(op.fields.map(f => [f.name, (this.values()[f.name] ?? '').trim()]));
  }

  private clearOutcome() {
    this.result.set(null);
    this.error.set(null);
    this.appliedFinding.set(null);
  }
}
