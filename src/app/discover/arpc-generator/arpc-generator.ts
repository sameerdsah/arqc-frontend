import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-arpc-generator',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './arpc-generator.html',
  styleUrl: './arpc-generator.css'
})
export class ArpcGenerator {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    arqc: ['', [Validators.required, Validators.pattern(/^[0-9A-Fa-f]{16}$/)]], // 9F26
    arc:  ['', [Validators.required, Validators.pattern(/^[0-9A-Fa-f]{4}$/)]]   // 8A
  });

  result = '';

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    const { arqc, arc } = this.form.getRawValue();

    // TODO: replace with your ARPC calculation or backend call
    this.result = `ARQC: ${arqc.toUpperCase()} | ARC: ${arc.toUpperCase()}`;
  }
}
