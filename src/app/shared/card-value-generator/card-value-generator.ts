import { Component, ChangeDetectorRef, Input, OnChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ExampleValuesLink } from '../example-values-link/example-values-link';
import { friendlyErrorMessage } from '../api-error';
import { ReceivedValueCheck } from '../received-check/received-check';
import { Calculation } from '../../core/operations/operations.models';

/** Settings for one card verification page, e.g. Visa CVV2 or Mastercard Chip CVC. */
export interface CardValueConfig {
  title: string;              // page heading, e.g. 'CVV2 Generator'
  subtitle: string;           // full name, e.g. 'Card Verification Value 2 (printed on the card)'
  valueName: string;          // short name used in messages, e.g. 'CVV2'
  apiUrl: string;             // backend endpoint, e.g. '/api/visa/cvv2'
  needsServiceCode: boolean;  // true for stripe values (CVV, CVC1); printed/chip values use a fixed code
  example?: { pan: string; expiry: string };  // test card for "Use example values" (default: network test card)
}

/**
 * One reusable form for every value calculated with the CVV algorithm.
 * Discover CVV / CID / iCVV, Visa CVV / CVV2 / iCVV and Mastercard CVC1 / CVC2 / Chip CVC
 * differ only in name, endpoint, test card and whether the user enters a service code.
 */
@Component({
  selector: 'app-card-value-generator',
  imports: [FormsModule, CommonModule, ExampleValuesLink, ReceivedValueCheck],
  templateUrl: './card-value-generator.html',
  styleUrl: './card-value-generator.css'
})
export class CardValueGenerator implements OnChanges {

  @Input({ required: true }) config!: CardValueConfig;

  cardRequest = { pan: '', expiry: '', service_code: '' };

  /** "Compare with a value you received": the value to check and the last calculation. */
  received = '';
  calculation: Calculation | null = null;

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // Moving to another value's page starts with a clean form
  ngOnChanges() {
    this.cardRequest = { pan: '', expiry: '', service_code: '' };
    this.received = '';
    this.calculation = null;
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  get resultPrefix(): string {
    return `The computed ${this.config.valueName} is:`;
  }

  /** Fills the page's test card (or the network's usual one: Visa 4111..., Mastercard 5555...); service code 101 where asked. */
  useExampleValues() {
    const card = this.config.example
      ?? { pan: this.config.apiUrl.includes('/mastercard/') ? '5555555555554444' : '4111111111111111', expiry: '3012' };
    this.cardRequest = { ...card, service_code: this.config.needsServiceCode ? '101' : '' };
    this.calculation = null;
    this.response = null;
    this.isError = false;
    this.error_response = null;
  }

  /** Applies a fix found by the Mismatch Explainer (e.g. another service code) and recalculates. */
  applyChanges(changes: Record<string, string>) {
    const { pan, expiry, service_code } = { ...this.cardRequest, ...changes };
    this.cardRequest = { pan, expiry, service_code };
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
