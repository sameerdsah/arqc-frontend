import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-arpc-generator',
  imports: [FormsModule, CommonModule],
  templateUrl: './arpc-generator.html',
  styleUrl: './arpc-generator.css'
})
export class ArpcGenerator {

  subtitle = 'Authorisation Response \u2014 Issuer\'s reply to the card';

  arpcRequest = {
    arqc: '',
    arc: ''
  };

  response: any = null;
  isSubmitting = false;
  isError = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  submitForm(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.response = null;
    this.isError = false;
    this.isSubmitting = true;

    this.http.post('/api/arpc', this.arpcRequest).pipe(
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
        this.cdr.detectChanges();
      }
    });
  }
}