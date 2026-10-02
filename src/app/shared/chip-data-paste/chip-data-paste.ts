import { Component, computed, input, output, signal } from '@angular/core';
import { chipValues, EMV_TAG_NAMES, flattenTlv, parseTlv, tagForField, TlvError } from '../../core/emv/tlv';

export interface ChipDataRow {
  tag: string;
  name: string;
  value: string;
  used: boolean;
}

/**
 * "Paste chip data": reads raw EMV TLV (e.g. ISO 8583 field 55 from a log or simulator) and
 * emits the values for the fields this form has. Everything happens in the browser.
 *
 *   <app-chip-data-paste [targets]="['tag_9f02', ...]" [example]="..." (filled)="apply($event)" />
 */
@Component({
  selector: 'app-chip-data-paste',
  templateUrl: './chip-data-paste.html',
  styleUrl: './chip-data-paste.css'
})
export class ChipDataPaste {
  /** API field names this form can fill, e.g. tag_9f02 ... tag_9f10, or arqc / arpc for a received value. */
  readonly targets = input.required<string[]>();
  /** Example chip data offered with "Use example chip data" (optional). */
  readonly example = input('');
  /** Field name -> value, only for the targets found in the chip data. */
  readonly filled = output<Record<string, string>>();

  readonly open = signal(false);
  readonly text = signal('');
  readonly error = signal<string | null>(null);
  readonly rows = signal<ChipDataRow[]>([]);
  readonly filledCount = signal(0);
  readonly missing = signal<string[]>([]);
  readonly hasResult = computed(() => this.rows().length > 0);

  useExample() {
    this.text.set(this.example());
    this.read();
  }

  setText(value: string) {
    this.text.set(value);
    this.error.set(null);
  }

  close() {
    this.open.set(false);
    this.error.set(null);
  }

  read() {
    this.error.set(null);
    this.rows.set([]);
    try {
      const tags = flattenTlv(parseTlv(this.text()));
      const { fields, sources } = chipValues(tags);
      const targets = this.targets();
      const values = Object.fromEntries(Object.entries(fields).filter(([name]) => targets.includes(name)));
      const usedTags = new Set(Object.keys(values).map(name => sources[name]));
      this.rows.set([...tags].map(([tag, value]) => ({ tag, name: EMV_TAG_NAMES[tag] ?? '', value, used: usedTags.has(tag) })));
      this.filledCount.set(Object.keys(values).length);
      // Shown as EMV tags ("8A"), the way testers know them, not as API field names ("tag_8a")
      this.missing.set(targets.filter(t => !(t in values)).map(t => tagForField(t) ?? t));
      if (Object.keys(values).length === 0) {
        this.error.set('None of the tags in this data are used by this form.');
        return;
      }
      this.filled.emit(values);
    } catch (e) {
      if (e instanceof TlvError) {
        this.error.set(e.message);
      } else {
        throw e;
      }
    }
  }
}
