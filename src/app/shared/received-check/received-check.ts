import { Component, computed, inject, Injector, input, model, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, Observable, of, startWith, switchMap } from 'rxjs';
import { OperationsService } from '../../core/operations/operations.service';
import { Calculation, DiagnosisFinding, Explanation } from '../../core/operations/operations.models';
import {
  changesOf, checkReport, IDLE, isApplied, LOADING, normaliseReceived, resultFormat
} from '../../core/operations/value-check';
import { CheckOutcome } from '../check-outcome/check-outcome';
import { buildCheckLink } from '../../core/operations/check-link';

interface ExplainRequest {
  path: string;
  input: Record<string, string>;
  received: string;
}

const sameRequest = (a: ExplainRequest | null, b: ExplainRequest | null) => JSON.stringify(a) === JSON.stringify(b);

/**
 * "Compare with a value you received" on every generator page.
 *
 * The tester pastes the value from the card, terminal or host log (or it comes from the chip data).
 * The verdict is instant and local: the page has just calculated the expected value. Only a mismatch
 * goes to the server, to the Mismatch Explainer, which finds the most likely cause; "Apply" hands
 * the input change back to the page, which recalculates - so a fix is one click and is proved by a Match.
 *
 *   <app-received-check [path]="config.apiUrl" valueName="ARQC" [calculation]="calculation"
 *                       [(received)]="received" (apply)="applyChanges($event)" />
 */
@Component({
  selector: 'app-received-check',
  imports: [CheckOutcome],
  templateUrl: './received-check.html',
  styleUrl: './received-check.css'
})
export class ReceivedValueCheck {
  private readonly api = inject(OperationsService);
  private readonly injector = inject(Injector);

  /** The page's endpoint, e.g. '/api/visa/arqc': the operation is found in the catalogue by it. */
  readonly path = input.required<string>();
  /** Short name of the value, e.g. 'ARQC', 'CVV2'. */
  readonly valueName = input.required<string>();
  /** The last calculation of the page (null until Submit succeeded). */
  readonly calculation = input<Calculation | null>(null);
  /** The value to check; two-way, so chip data (9F26 / 91) can fill it. */
  readonly received = model('');
  /** Input changes to apply; the page updates its form and recalculates. */
  readonly apply = output<Record<string, string>>();

  private readonly opened = signal(false);
  private readonly appliedFinding = signal<DiagnosisFinding | null>(null);

  readonly expanded = computed(() => this.opened() || !!this.received().trim());
  readonly value = computed(() => normaliseReceived(this.received()));
  readonly format = computed(() => {
    const calc = this.calculation();
    return calc ? resultFormat(calc.result) : null;
  });
  readonly formatError = computed(() => {
    const format = this.format();
    return !!format && !!this.value() && !format.pattern.test(this.value());
  });
  /** Ready to compare: a calculation and a received value of the same format. */
  readonly compared = computed(() => {
    const calc = this.calculation();
    return calc && this.value() && !this.formatError() ? { expected: calc.result, received: this.value() } : null;
  });
  readonly applied = computed(() => {
    const finding = this.appliedFinding();
    return isApplied(finding, this.calculation()?.input) ? finding : null;
  });

  private readonly explainRequest = computed<ExplainRequest | null>(() => {
    const c = this.compared();
    const calc = this.calculation();
    return c && calc && c.expected !== c.received ? { path: this.path(), input: calc.input, received: c.received } : null;
  });

  /** Explanation of the current mismatch; a newer mismatch cancels an older request. */
  readonly explanation = toSignal(
    toObservable(this.explainRequest).pipe(
      distinctUntilChanged(sameRequest),
      switchMap(request => request ? this.explain(request) : of(IDLE))),
    { initialValue: IDLE });

  /** Link that reopens this page with the same input and received value, and runs the check. */
  readonly link = computed(() => {
    const c = this.compared();
    const calc = this.calculation();
    return c && calc && typeof location !== 'undefined'
      ? buildCheckLink(location.origin, location.pathname, calc.input, c.received) : '';
  });

  readonly report = computed(() => {
    const c = this.compared();
    const calc = this.calculation();
    return c && calc ? checkReport({ value: `${this.valueName()} (POST ${this.path()})`, input: calc.input,
                                     expected: c.expected, received: c.received, explanation: this.explanation(),
                                     link: this.link() }) : '';
  });

  open() {
    this.opened.set(true);
  }

  close() {
    this.opened.set(false);
    this.setReceived('');
  }

  setReceived(value: string) {
    this.received.set(value);
    this.appliedFinding.set(null);
  }

  applyFinding(finding: DiagnosisFinding) {
    if (finding.operation) {
      // The received value is another value of this card (e.g. the CID, not the CVV): open that page.
      const url = '/' + finding.operation.id;           // page addresses are the operation ids
      const router = this.injector.get(Router, null);    // resolved only when needed
      if (router) {
        void router.navigateByUrl(url);
      } else {
        window.location.assign(url);
      }
      return;
    }
    this.appliedFinding.set(finding);
    this.apply.emit(changesOf(finding));
  }

  private explain(request: ExplainRequest): Observable<Explanation> {
    return this.api.catalogue$.pipe(
      map(catalogue => catalogue.operations.find(op => op.path === request.path) ?? null),
      switchMap(op => !op ? of(IDLE) : this.api
        .verify({ operation: op.id, input: request.input, received: request.received, diagnose: true })
        .pipe(map((result): Explanation =>
          !result.valid && result.diagnosis ? { status: 'done', diagnosis: result.diagnosis } : IDLE))),
      catchError(() => of<Explanation>({ status: 'error', message: 'The cause could not be checked.' })),
      startWith(LOADING));
  }
}
