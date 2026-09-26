import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-aac-generator',
  imports: [FormsModule, CommonModule],
  templateUrl: './aac-generator.html',
  styleUrl: './aac-generator.css'
})
export class AacGenerator {

  title = 'AAC Generator';
  subtitle = 'Application Authentication \u2014 Cryptogram for a declined transaction';
  apiUrl = '/api/aac';
  resultPrefix = 'The computed AAC is:';

  // CDOL2-style data for the 2nd GENERATE AC: the issuer's DECLINE code (8A)
  // plus the same transaction data that was used for the ARQC.
  aacRequest = {
    tag_8a: '',
    tag_9f02: '',
    tag_5f2a: '',
    tag_9f37: '',
    tag_9f36: '',
    tag_9f10: ''
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

    this.http.post(this.apiUrl, this.aacRequest).pipe(
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
