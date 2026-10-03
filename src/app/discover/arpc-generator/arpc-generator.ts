import { Component } from '@angular/core';
import { ArpcForm, ArpcConfig } from '../../shared/arpc-form/arpc-form';

/**
 * Discover ARPC - Authorization Response Cryptogram, EMV Method 1 (POST /api/arpc).
 * The form itself is the shared ArpcForm (same as Visa, Mastercard and Amex); this page supplies its settings.
 */
@Component({
  selector: 'app-arpc-generator',
  imports: [ArpcForm],
  templateUrl: './arpc-generator.html',
  styleUrl: './arpc-generator.css'
})
export class ArpcGenerator {

  readonly config: ArpcConfig = {
    title: 'ARPC Generator',
    subtitle: 'Authorization Response Cryptogram — issuer reply to the ARQC (EMV Method 1)',
    apiUrl: '/api/arpc'
  };
}
