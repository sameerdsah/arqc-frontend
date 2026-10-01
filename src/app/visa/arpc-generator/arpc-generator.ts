import { Component } from '@angular/core';
import { ArpcForm, ArpcConfig } from '../../shared/arpc-form/arpc-form';

/**
 * Visa ARPC - Authorization Response Cryptogram, EMV Method 1 (POST /api/visa/arpc).
 * The form itself is the shared ArpcForm; this page supplies its settings.
 */
@Component({
  selector: 'app-visa-arpc-generator',
  imports: [ArpcForm],
  templateUrl: './arpc-generator.html',
  styleUrl: './arpc-generator.css'
})
export class VisaArpcGenerator {

  readonly config: ArpcConfig = {
    title: 'ARPC Generator',
    subtitle: 'Authorization Response Cryptogram — issuer reply to the ARQC (EMV Method 1)',
    apiUrl: '/api/visa/arpc'
  };
}
