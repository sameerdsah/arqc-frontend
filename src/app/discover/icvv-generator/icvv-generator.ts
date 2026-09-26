import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-icvv-generator',
  imports: [FormsModule, CommonModule],
  templateUrl: './icvv-generator.html',
  styleUrl: './icvv-generator.css'
})
export class IcvvGenerator {

  title = 'iCVV Generator';
  subtitle = 'Integrated Card Verification Value (stored in the chip)';
  apiUrl = '/api/icvv';
  resultPrefix = 'The computed iCVV is:';

  icvvRequest = {
    pan: '',
    expiry: ''
  };

  response: any = null;
  isSubmitting = false;
  isError = false;
  error_response: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  submitForm(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.response = null;
    this.isError = false;
    this.error_response = null;
    this.isSubmitting = true;

    this.http.post(this.apiUrl, this.icvvRequest).pipe(
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
