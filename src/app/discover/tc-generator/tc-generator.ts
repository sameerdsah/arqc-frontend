import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tc-generator',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './tc-generator.html',
  styleUrl: './tc-generator.css'
})
export class TcGenerator {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    amount:   ['', [Validators.required, Validators.pattern(/^[0-9]{12}$/)]],             // 9F02
    currency: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],              // 5F2A
    un:       ['', [Validators.required, Validators.pattern(/^[0-9A-Fa-f]{8}$/)]],        // 9F37
    atc:      ['', [Validators.required, Validators.pattern(/^[0-9A-Fa-f]{4}$/)]],        // 9F36
    iad:      ['', [Validators.required, Validators.pattern(/^([0-9A-Fa-f]{2}){1,32}$/)]] // 9F10
  });

  result = '';

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    const values = this.form.getRawValue();

    // TODO: replace with your TC calculation or backend call
    this.result = JSON.stringify(values);
  }
}
