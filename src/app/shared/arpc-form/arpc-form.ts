import { Component, ChangeDetectorRef, Input, OnChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

/** Settings for one scheme's ARPC page. */
export interface ArpcConfig {
  title: string;
  subtitle: string;
  apiUrl: string;   // e.g. '/api/mastercard/arpc'
}

/** One reusable ARPC form (EMV Method 1): ARQC + Authorisation Response Code (8A). */
@Component({
  selector: 'app-arpc-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './arpc-form.html',
  styleUrl: './arpc-form.css'
})
export class ArpcForm implements OnChanges {

  @Input({ required: true }) config!: ArpcConfig;

  arpcRequest = { arqc: '', tag_8a: '' };

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnChanges() {
    this.arpcRequest = { arqc: '', tag_8a: '' };
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

    this.http.post(this.config.apiUrl, this.arpcRequest).pipe(
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
