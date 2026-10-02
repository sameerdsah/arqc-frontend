import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ExampleValuesLink } from '../../shared/example-values-link/example-values-link';
import { friendlyErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-arpc-generator',
  imports: [FormsModule, CommonModule, ExampleValuesLink],
  templateUrl: './arpc-generator.html',
  styleUrl: './arpc-generator.css'
})
export class ArpcGenerator {

  title = 'ARPC Generator';
  subtitle = 'Authorization Response Cryptogram — issuer reply to the ARQC (EMV Method 1)';
  apiUrl = '/api/arpc';
  resultPrefix = 'The computed ARPC is:';

  arpcRequest = {
    arqc: '',
    tag_8a: ''
  };

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  /** Fills the documented test values (they give the documented result). */
  useExampleValues() {
    this.arpcRequest = { arqc: '37858601E2285A5D', tag_8a: '3030' };
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

    this.http.post(this.apiUrl, this.arpcRequest).pipe(
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
