import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { OperationsService } from '../../core/operations/operations.service';
import {
  BatchItemResult, BatchResult, DiagnosisFinding, groupByNetwork, OperationGroup, OperationInfo
} from '../../core/operations/operations.models';
import { downloadText, parseCsv, toCsv } from '../../core/csv/csv';
import { friendlyErrorMessage } from '../../shared/api-error';
import {
  buildTemplate, csvToBatchItems, fixText, itemCause, itemStatus, ItemStatus, ParsedBatch, resultsToCsv
} from './batch-csv';

const MAX_FILE_BYTES = 1024 * 1024;   // far above 500 rows; protects the browser from huge files

/**
 * Generate - or verify - up to 500 values in one go from a CSV file.
 * Steps: choose the value, download the template, upload the CSV, run, download the results.
 * Rows with a received value are verified, and every mismatch is explained (Mismatch Explainer):
 * the summary counts the causes, and a click on a cause shows only those rows.
 */
@Component({
  selector: 'app-batch-generation',
  templateUrl: './batch-generation.html',
  styleUrl: './batch-generation.css'
})
export class BatchGeneration {
  private readonly api = inject(OperationsService);

  readonly operations = signal<OperationInfo[]>([]);
  readonly groups = signal<OperationGroup[]>([]);
  readonly maxItems = signal(500);
  readonly loadError = signal<string | null>(null);

  readonly selectedId = signal('');
  readonly selected = computed(() => this.operations().find(op => op.id === this.selectedId()) ?? null);

  readonly sourceName = signal('');
  private readonly csvText = signal('');
  readonly fileError = signal<string | null>(null);
  readonly parsed = computed<ParsedBatch | null>(() => {
    const op = this.selected();
    const text = this.csvText();
    return op && text ? csvToBatchItems(parseCsv(text), op, this.maxItems()) : null;
  });
  readonly ready = computed(() => !!this.parsed() && !this.parsed()!.errors.length && this.parsed()!.items.length > 0);

  readonly busy = signal(false);
  readonly result = signal<BatchResult | null>(null);
  readonly error = signal<string | null>(null);

  /** Show only the rows with this cause (null: all rows). */
  readonly causeFilter = signal<string | null>(null);
  readonly visibleResults = computed(() => {
    const rows = this.result()?.results ?? [];
    const cause = this.causeFilter();
    return cause ? rows.filter(r => itemCause(r)?.cause === cause) : rows;
  });
  readonly explained = computed(() => (this.result()?.results ?? []).some(r => !!r.diagnosis));

  constructor() {
    this.api.catalogue$.pipe(takeUntilDestroyed()).subscribe({
      next: catalogue => {
        this.operations.set(catalogue.operations);
        this.groups.set(groupByNetwork(catalogue.operations));
        this.maxItems.set(catalogue.max_batch_items);
        if (!this.selectedId() && catalogue.operations.length) {
          this.selectedId.set(catalogue.operations[0].id);
        }
      },
      error: err => this.loadError.set(friendlyErrorMessage(err))
    });
  }

  select(id: string) {
    this.selectedId.set(id);           // an already loaded file is checked again for the new value
    this.clearOutcome();
  }

  downloadTemplate() {
    const op = this.selected();
    if (op) {
      downloadText(`${op.id.replace('/', '-')}-template.csv`, toCsv(buildTemplate(op)));
    }
  }

  /** Three copies of the example row - a quick way to try the page or to demo it. */
  loadSampleRows() {
    const op = this.selected();
    if (!op) {
      return;
    }
    const [header, example] = buildTemplate(op);
    const rows = [header, ...[1, 2, 3].map(n => [`row-${n}`, ...example.slice(1)])];
    this.load(toCsv(rows), 'sample rows');
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';                  // choosing the same file again still triggers a change
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.fileError.set('The file is larger than 1 MB. A batch can contain at most 500 rows.');
      return;
    }
    this.load(await file.text(), file.name);
  }

  private load(text: string, name: string) {
    this.fileError.set(null);
    this.csvText.set(text);
    this.sourceName.set(name);
    this.clearOutcome();
  }

  run() {
    const op = this.selected();
    const parsed = this.parsed();
    if (!op || !parsed || !this.ready() || this.busy()) {
      return;
    }
    this.clearOutcome();
    this.busy.set(true);
    // Rows with a received value are verified; their mismatches are explained as well
    const diagnose = parsed.items.some(item => !!item.received);
    this.api.runBatch({ operation: op.id, items: parsed.items, ...(diagnose ? { diagnose } : {}) })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: result => this.result.set(result),
        error: err => this.error.set(friendlyErrorMessage(err))
      });
  }

  downloadResults() {
    const op = this.selected();
    const parsed = this.parsed();
    const result = this.result();
    if (op && parsed && result) {
      downloadText(`${op.id.replace('/', '-')}-results.csv`, toCsv(resultsToCsv(op, parsed.items, result)));
    }
  }

  status(r: BatchItemResult): ItemStatus {
    return itemStatus(r);
  }

  causeOf(r: BatchItemResult) {
    return itemCause(r);
  }

  fix(finding: DiagnosisFinding): string {
    return fixText(finding);
  }

  /** Bar length of a cause, relative to all mismatches. */
  share(count: number): number {
    const total = this.result()?.summary.mismatched ?? 0;
    return total ? Math.round((100 * count) / total) : 0;
  }

  toggleCause(cause: string) {
    this.causeFilter.update(current => (current === cause ? null : cause));
  }

  private clearOutcome() {
    this.result.set(null);
    this.error.set(null);
    this.causeFilter.set(null);
  }
}
