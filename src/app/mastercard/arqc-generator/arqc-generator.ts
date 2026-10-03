import { Component } from '@angular/core';
import { EmvArqcForm, EmvArqcConfig, fullEmvDataSet } from '../../shared/emv-arqc-form/emv-arqc-form';

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
    fields: fullEmvDataSet({
      iadPattern: '^(?:[0-9A-Fa-f]{2}){8,32}$',
      aip: '1800',
      exampleIad: '0110A00003220000000000000000000000FF'
    })
  };
}
