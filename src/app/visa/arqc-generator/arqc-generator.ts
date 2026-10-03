import { Component } from '@angular/core';
import { EmvArqcForm, EmvArqcConfig, fullEmvDataSet } from '../../shared/emv-arqc-form/emv-arqc-form';

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
    fields: fullEmvDataSet({
      iadPattern: '^(?:[0-9A-Fa-f]{2}){7,32}$',
      aip: '3C00',
      exampleIad: '06010A03A00000'
    }),
    exampleResult: '949BBD6013450C7D'
  };
}
