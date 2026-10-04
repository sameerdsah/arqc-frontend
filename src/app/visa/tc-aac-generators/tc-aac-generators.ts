import { Component } from '@angular/core';
import { EmvArqcConfig, EmvArqcForm, fullEmvDataSet } from '../../shared/emv-arqc-form/emv-arqc-form';

/**
 * Visa TC and AAC - the cryptograms the card returns when the payment is approved (TC, 9F27 = 40)
 * or declined (AAC, 9F27 = 00). Same inputs and calculation as the Visa ARQC; each has its own address
 * (/api/visa/tc, /api/visa/aac) and page, like every other value.
 */
const FIELDS = fullEmvDataSet({ iadPattern: '^(?:[0-9A-Fa-f]{2}){7,32}$', aip: '3C00', exampleIad: '06010A03A00000' });

@Component({
  selector: 'app-visa-tc-generator',
  imports: [EmvArqcForm],
  template: '<app-emv-arqc-form [config]="config"></app-emv-arqc-form>'
})
export class VisaTcGenerator {
  readonly config: EmvArqcConfig = {
    title: 'TC Generator',
    subtitle: 'Transaction Certificate (9F26, 9F27 = 40) — Visa CVN 10 / CVN 18',
    apiUrl: '/api/visa/tc',
    fields: FIELDS,
    exampleResult: '949BBD6013450C7D',
    cryptogramType: 'TC'
  };
}

@Component({
  selector: 'app-visa-aac-generator',
  imports: [EmvArqcForm],
  template: '<app-emv-arqc-form [config]="config"></app-emv-arqc-form>'
})
export class VisaAacGenerator {
  readonly config: EmvArqcConfig = {
    title: 'AAC Generator',
    subtitle: 'Application Authentication Cryptogram (9F26, 9F27 = 00) — Visa CVN 10 / CVN 18',
    apiUrl: '/api/visa/aac',
    fields: FIELDS,
    exampleResult: '949BBD6013450C7D',
    cryptogramType: 'AAC'
  };
}
