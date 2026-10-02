import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ExampleValuesLink } from '../../shared/example-values-link/example-values-link';
import { friendlyErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-cid-generator',
  imports: [FormsModule, CommonModule, ExampleValuesLink],
  templateUrl: './cid-generator.html',
  styleUrl: './cid-generator.css'
})
export class CidGenerator {

  title = 'CID Generator';
  subtitle = 'Card Identification Number (printed on the card)';
  apiUrl = '/api/cid';
  resultPrefix = 'The computed CID is:';

  cidRequest = {
    pan: '',
    expiry: ''
  };

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  /** Fills the documented test values (they give the documented result). */
  useExampleValues() {
    this.cidRequest = { pan: '4123456789012345', expiry: '8701' };
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

    this.http.post(this.apiUrl, this.cidRequest).pipe(
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
