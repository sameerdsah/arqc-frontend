import { Component } from '@angular/core';
import { EmvArqcForm, EmvArqcConfig } from '../../shared/emv-arqc-form/emv-arqc-form';

/**
 * Visa ARQC - Authorization Request Cryptogram (9F26), Visa CVN 10 / CVN 18.
 * Uses the full EMV data set; the calculation is done by POST /api/visa/arqc.
 * The form itself is the shared EmvArqcForm; this page supplies its settings.
 */
@Component({
  selector: 'app-visa-arqc-generator',
  imports: [EmvArqcForm],
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class VisaArqcGenerator {

  readonly config: EmvArqcConfig = {
    title: 'ARQC Generator',
    subtitle: 'Authorization Request Cryptogram (9F26) — Visa CVN 10 / CVN 18',
    apiUrl: '/api/visa/arqc',
    iadPattern: '^(?:[0-9A-Fa-f]{2}){7,32}$'
  };
}
