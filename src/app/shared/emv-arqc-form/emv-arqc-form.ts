import { Component, ChangeDetectorRef, Input, OnChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { friendlyErrorMessage } from '../api-error';

/** Settings for one scheme's ARQC page, e.g. Visa or Mastercard. */
export interface EmvArqcConfig {
  title: string;       // page heading, e.g. 'ARQC Generator'
  subtitle: string;    // full name shown under the heading
  apiUrl: string;      // backend endpoint, e.g. '/api/visa/arqc'
  iadPattern: string;  // allowed format of tag 9F10 for this scheme
}

interface EmvField {
  key: string;      // name sent to the API, e.g. 'tag_9f02'
  id: string;       // HTML id, e.g. 'tag9F02'
  label: string;    // e.g. 'Tag 9F02 (Amount, Authorized)'
  pattern: string;
  message: string;  // shown when the format is wrong
}

// The EMV recommended minimum data set (CDOL1), in the order the card uses it,
// followed by the Issuer Application Data (9F10).
const TERMINAL_FIELDS: EmvField[] = [
  { key: 'tag_9f02', id: 'tag9F02', label: 'Tag 9F02 (Amount, Authorized)', pattern: '^[0-9]{12}$', message: 'Please enter a valid amount' },
  { key: 'tag_9f03', id: 'tag9F03', label: 'Tag 9F03 (Amount, Other)', pattern: '^[0-9]{12}$', message: 'Please enter a valid other amount' },
  { key: 'tag_9f1a', id: 'tag9F1A', label: 'Tag 9F1A (Terminal Country Code)', pattern: '^[0-9]{4}$', message: 'Please enter a valid country code' },
  { key: 'tag_95', id: 'tag95', label: 'Tag 95 (Terminal Verification Results)', pattern: '^[0-9A-Fa-f]{10}$', message: 'Please enter valid terminal verification results' },
  { key: 'tag_5f2a', id: 'tag5F2A', label: 'Tag 5F2A (Currency Code)', pattern: '^[0-9]{4}$', message: 'Please enter a valid currency code' },
  { key: 'tag_9a', id: 'tag9A', label: 'Tag 9A (Transaction Date, YYMMDD)', pattern: '^[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$', message: 'Please enter a valid date' },
  { key: 'tag_9c', id: 'tag9C', label: 'Tag 9C (Transaction Type)', pattern: '^[0-9]{2}$', message: 'Please enter a valid transaction type' },
  { key: 'tag_9f37', id: 'tag9F37', label: 'Tag 9F37 (Unpredictable Number)', pattern: '^[0-9A-Fa-f]{8}$', message: 'Please enter a valid unpredictable number' },
  { key: 'tag_82', id: 'tag82', label: 'Tag 82 (Application Interchange Profile)', pattern: '^[0-9A-Fa-f]{4}$', message: 'Please enter a valid application interchange profile' },
  { key: 'tag_9f36', id: 'tag9F36', label: 'Tag 9F36 (Application Transaction Counter)', pattern: '^[0-9A-Fa-f]{4}$', message: 'Please enter a valid transaction counter' }
];

/** One reusable ARQC form for the schemes that use the full EMV data set (Visa, Mastercard). */
@Component({
  selector: 'app-emv-arqc-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './emv-arqc-form.html',
  styleUrl: './emv-arqc-form.css'
})
export class EmvArqcForm implements OnChanges {

  @Input({ required: true }) config!: EmvArqcConfig;

  fields: EmvField[] = [];
  arqcRequest: Record<string, string> = {};

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnChanges() {
    this.fields = [
      ...TERMINAL_FIELDS,
      { key: 'tag_9f10', id: 'tag9F10', label: 'Tag 9F10 (Issuer Application Data)', pattern: this.config.iadPattern, message: 'Please enter valid issuer application data' }
    ];
    this.arqcRequest = Object.fromEntries(this.fields.map(f => [f.key, '']));
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  submitForm(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.response = null;
    this.isError = false;
    this.error_response = null;
    this.isSubmitting = true;

    this.http.post(this.config.apiUrl, this.arqcRequest).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.response = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Request failed with status', err?.status);
        this.isError = true;
        this.error_response = friendlyErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
