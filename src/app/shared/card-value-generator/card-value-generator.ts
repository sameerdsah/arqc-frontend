import { Component, ChangeDetectorRef, Input, OnChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

/** Settings for one card verification page, e.g. Visa CVV2 or Mastercard Chip CVC. */
export interface CardValueConfig {
  title: string;              // page heading, e.g. 'CVV2 Generator'
  subtitle: string;           // full name, e.g. 'Card Verification Value 2 (printed on the card)'
  valueName: string;          // short name used in messages, e.g. 'CVV2'
  apiUrl: string;             // backend endpoint, e.g. '/api/visa/cvv2'
  needsServiceCode: boolean;  // true for stripe values (CVV, CVC1); printed/chip values use a fixed code
}

/**
 * One reusable form for every value calculated with the CVV algorithm.
 * Visa CVV / CVV2 / iCVV and Mastercard CVC1 / CVC2 / Chip CVC differ only in
 * name, endpoint and whether the user enters a service code.
 */
@Component({
  selector: 'app-card-value-generator',
  imports: [FormsModule, CommonModule],
  templateUrl: './card-value-generator.html',
  styleUrl: './card-value-generator.css'
})
export class CardValueGenerator implements OnChanges {

  @Input({ required: true }) config!: CardValueConfig;

  cardRequest = { pan: '', expiry: '', service_code: '' };

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // Moving to another value's page starts with a clean form
  ngOnChanges() {
    this.cardRequest = { pan: '', expiry: '', service_code: '' };
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  get resultPrefix(): string {
    return `The computed ${this.config.valueName} is:`;
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

    const body: Record<string, string> = { pan: this.cardRequest.pan, expiry: this.cardRequest.expiry };
    if (this.config.needsServiceCode) {
      body['service_code'] = this.cardRequest.service_code;
    }

    this.http.post(this.config.apiUrl, body).pipe(
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
        console.error('Backend error:', err);
        this.isError = true;
        this.error_response = err.error?.error ?? 'Unable to reach the server. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
