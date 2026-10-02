import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { OperationsService } from '../../core/operations/operations.service';
import {
  groupByNetwork, OperationGroup, OperationInfo, VerifyResult
} from '../../core/operations/operations.models';
import { friendlyErrorMessage } from '../../shared/api-error';

export interface DiffChar {
  char: string;
  same: boolean;
}

/** Marks each character of `received` that differs from `expected` (same position). */
export function compareChars(expected: string, received: string): DiffChar[] {
  return [...received].map((char, i) => ({ char, same: expected[i] === char }));
}

/**
 * Verify a value received from a card, terminal or simulator (ARQC, ARPC, CVV ...).
 * The form is built from the operation catalogue, so it works for every value the API offers.
 */
@Component({
  selector: 'app-verify-value',
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
  readonly diff = computed(() => {
    const r = this.result();
    return r && !r.valid ? compareChars(r.expected, r.received) : [];
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

  useExampleValues() {
    const op = this.selected();
    if (op) {
      this.values.set(Object.fromEntries(op.fields.map(f => [f.name, f.example])));
      this.clearOutcome();
    }
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
    const input = Object.fromEntries(op.fields.map(f => [f.name, (this.values()[f.name] ?? '').trim()]));
    this.api.verify({ operation: op.id, input, received: this.received().trim() })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: result => this.result.set(result),
        error: err => this.error.set(friendlyErrorMessage(err))
      });
  }

  private clearOutcome() {
    this.result.set(null);
    this.error.set(null);
  }
}
