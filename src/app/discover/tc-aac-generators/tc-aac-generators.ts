import { Component } from '@angular/core';
import { EmvArqcConfig, EmvArqcForm } from '../../shared/emv-arqc-form/emv-arqc-form';
import { DISCOVER_ARQC_FIELDS } from '../discover-test-data';

/**
 * Discover TC and AAC - the cryptograms the card returns when the payment is approved (TC, 9F27 = 40)
 * or declined (AAC, 9F27 = 00). Same inputs and calculation as the Discover ARQC; each has its own address
 * (/api/tc, /api/aac) and page, like every other value.
 */
const FIELDS = DISCOVER_ARQC_FIELDS;

@Component({
  selector: 'app-discover-tc-generator',
  imports: [EmvArqcForm],
  template: '<app-emv-arqc-form [config]="config"></app-emv-arqc-form>'
})
export class DiscoverTcGenerator {
  readonly config: EmvArqcConfig = {
    title: 'TC Generator',
    subtitle: 'Transaction Certificate (9F26, 9F27 = 40) — D-PAS CVN 15 / 16',
    apiUrl: '/api/tc',
    fields: FIELDS,
    exampleResult: '37858601E2285A5D',
    cryptogramType: 'TC'
  };
}

@Component({
  selector: 'app-discover-aac-generator',
  imports: [EmvArqcForm],
  template: '<app-emv-arqc-form [config]="config"></app-emv-arqc-form>'
})
export class DiscoverAacGenerator {
  readonly config: EmvArqcConfig = {
    title: 'AAC Generator',
    subtitle: 'Application Authentication Cryptogram (9F26, 9F27 = 00) — D-PAS CVN 15 / 16',
    apiUrl: '/api/aac',
    fields: FIELDS,
    exampleResult: '37858601E2285A5D',
    cryptogramType: 'AAC'
  };
}
