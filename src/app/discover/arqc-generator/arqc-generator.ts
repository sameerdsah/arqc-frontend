import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ChipDataPaste } from '../../shared/chip-data-paste/chip-data-paste';
import { buildTlv } from '../../core/emv/tlv';
import { friendlyErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-arqc-generator',
  imports: [FormsModule, CommonModule, ChipDataPaste],
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class ArqcGenerator {

  title = 'ARQC Generator';
  subtitle = 'Authorization Request Cryptogram — Application Cryptogram (9F26)';
  apiUrl = '/api/arqc';
  resultPrefix = 'The computed ARQC is:';

  arqcRequest = {
    tag_9f02: '',
    tag_5f2a: '',
    tag_9f37: '',
    tag_9f36: '',
    tag_9f10: ''
  };

  // Chip data paste: the five tags this page uses; the example also carries 9F26 / 9F27 (not needed here)
  readonly chipTargets = ['tag_9f02', 'tag_5f2a', 'tag_9f37', 'tag_9f36', 'tag_9f10'];
  readonly exampleChipData = buildTlv([['9F02', '000000010000'], ['5F2A', '0978'], ['9F37', '12345678'], ['9F36', '0001'],
                                       ['9F10', '06150102030405060708'], ['9F26', '37858601E2285A5D'], ['9F27', '80']]);

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  applyChipData(values: Record<string, string>) {
    this.arqcRequest = { ...this.arqcRequest, ...values };
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

    this.http.post(this.apiUrl, this.arqcRequest).pipe(
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
