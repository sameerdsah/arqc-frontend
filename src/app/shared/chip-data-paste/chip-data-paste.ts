import { Component, input, output, signal } from '@angular/core';
import { chipValues, flattenTlv, parseTlv, TlvError } from '../../core/emv/tlv';

/**
 * "Paste chip data": reads raw EMV TLV (e.g. ISO 8583 field 55 from a log or simulator) and
 * emits the values for the fields this form has. Everything happens in the browser.
 * The filled form fields are the confirmation; only problems (broken data, no usable tags) are shown here.
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
    try {
      const { fields } = chipValues(flattenTlv(parseTlv(this.text())));
      const targets = this.targets();
      const values = Object.fromEntries(Object.entries(fields).filter(([name]) => targets.includes(name)));
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
