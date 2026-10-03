import { Component, ChangeDetectorRef, Input, OnChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ExampleValuesLink } from '../example-values-link/example-values-link';
import { ChipDataPaste } from '../chip-data-paste/chip-data-paste';
import { buildTlv } from '../../core/emv/tlv';
import { friendlyErrorMessage } from '../api-error';
import { ReceivedValueCheck } from '../received-check/received-check';
import { Calculation } from '../../core/operations/operations.models';

/** Settings for one scheme's ARPC page. */
export interface ArpcConfig {
  title: string;
  subtitle: string;
  apiUrl: string;   // e.g. '/api/mastercard/arpc'
}

/** One reusable ARPC form (EMV Method 1): ARQC + Authorisation Response Code (8A). */
@Component({
  selector: 'app-arpc-form',
  imports: [FormsModule, CommonModule, ExampleValuesLink, ChipDataPaste, ReceivedValueCheck],
  templateUrl: './arpc-form.html',
  styleUrl: './arpc-form.css'
})
export class ArpcForm implements OnChanges {

  @Input({ required: true }) config!: ArpcConfig;

  arpcRequest = { arqc: '', tag_8a: '' };

  // Paste chip data: the ARQC comes from tag 9F26, the response code from tag 8A and the ARPC to
  // check from tag 91 (Issuer Authentication Data = ARPC + response code, from the host's response).
  // Real request data (field 55) usually has no 8A (the issuer decides it), so it is then typed in;
  // the example carries 8A = 3030 (approved) and the matching 91, so it fills the whole page.
  readonly chipTargets = ['arqc', 'tag_8a', 'arpc'];
  readonly exampleChipData = buildTlv([['9F02', '000000010000'], ['5F2A', '0978'], ['9F37', '12345678'], ['9F36', '0001'],
                                       ['9F10', '06150102030405060708'], ['9F26', '37858601E2285A5D'], ['9F27', '80'],
                                       ['8A', '3030'], ['91', 'C837D13061C1E8963030']]);

  /** "Compare with a value you received": the value to check and the last calculation. */
  received = '';
  calculation: Calculation | null = null;

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnChanges() {
    this.arpcRequest = { arqc: '', tag_8a: '' };
    this.received = '';
    this.calculation = null;
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  /** Values read from pasted chip data replace the matching fields. */
  applyChipData(values: Record<string, string>) {
    const { arpc, ...fields } = values;
    this.arpcRequest = { ...this.arpcRequest, ...fields };
    if (arpc) {
      this.received = arpc;   // the ARPC from the host's response (91): Submit then checks it
    }
    this.calculation = null;
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  /** Fills the documented test values (they give the documented result). */
  useExampleValues() {
    this.arpcRequest = { arqc: '37858601E2285A5D', tag_8a: '3030' };
    this.calculation = null;
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  /** Applies a fix found by the Mismatch Explainer (e.g. the response code as ASCII) and recalculates. */
  applyChanges(changes: Record<string, string>) {
    const { arqc, tag_8a } = { ...this.arpcRequest, ...changes };
    this.arpcRequest = { arqc, tag_8a };
    this.calculate();
  }

  submitForm(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.calculate();
  }

  private calculate() {
    this.response = null;
    this.calculation = null;
    this.isError = false;
    this.error_response = null;
    this.isSubmitting = true;
    const body = { ...this.arpcRequest };

    this.http.post(this.config.apiUrl, body).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data: any) => {
        this.response = data;
        this.calculation = data?.result ? { input: body, result: data.result } : null;
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
