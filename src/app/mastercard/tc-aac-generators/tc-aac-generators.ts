import { Component } from '@angular/core';
import { EmvArqcConfig, EmvArqcForm, fullEmvDataSet } from '../../shared/emv-arqc-form/emv-arqc-form';

/**
 * Mastercard TC and AAC - the cryptograms the card returns when the payment is approved (TC, 9F27 = 40)
 * or declined (AAC, 9F27 = 00). Same inputs and calculation as the Mastercard ARQC; each has its own address
 * (/api/mastercard/tc, /api/mastercard/aac) and page, like every other value.
 */
const FIELDS = fullEmvDataSet({ iadPattern: '^(?:[0-9A-Fa-f]{2}){8,32}$', aip: '1800', exampleIad: '0110A00003220000000000000000000000FF' });

@Component({
  selector: 'app-mastercard-tc-generator',
  imports: [EmvArqcForm],
  template: '<app-emv-arqc-form [config]="config"></app-emv-arqc-form>'
})
export class MastercardTcGenerator {
  readonly config: EmvArqcConfig = {
    title: 'TC Generator',
    subtitle: 'Transaction Certificate (9F26, 9F27 = 40) — M/Chip',
    apiUrl: '/api/mastercard/tc',
    fields: FIELDS,
    exampleResult: '9B855F941F555627',
    cryptogramType: 'TC'
  };
}

@Component({
  selector: 'app-mastercard-aac-generator',
  imports: [EmvArqcForm],
  template: '<app-emv-arqc-form [config]="config"></app-emv-arqc-form>'
})
export class MastercardAacGenerator {
  readonly config: EmvArqcConfig = {
    title: 'AAC Generator',
    subtitle: 'Application Authentication Cryptogram (9F26, 9F27 = 00) — M/Chip',
    apiUrl: '/api/mastercard/aac',
    fields: FIELDS,
    exampleResult: '9B855F941F555627',
    cryptogramType: 'AAC'
  };
}
