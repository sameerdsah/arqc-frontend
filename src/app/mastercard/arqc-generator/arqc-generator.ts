import { Component } from '@angular/core';
import { EmvArqcForm, EmvArqcConfig } from '../../shared/emv-arqc-form/emv-arqc-form';

/**
 * Mastercard ARQC - Authorization Request Cryptogram (9F26), M/Chip.
 * Uses the full EMV data set; the calculation is done by POST /api/mastercard/arqc.
 * The form itself is the shared EmvArqcForm; this page supplies its settings.
 */
@Component({
  selector: 'app-mastercard-arqc-generator',
  imports: [EmvArqcForm],
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class MastercardArqcGenerator {

  readonly config: EmvArqcConfig = {
    title: 'ARQC Generator',
    subtitle: 'Authorization Request Cryptogram (9F26) — M/Chip',
    apiUrl: '/api/mastercard/arqc',
    iadPattern: '^(?:[0-9A-Fa-f]{2}){8,32}$'
  };
}
