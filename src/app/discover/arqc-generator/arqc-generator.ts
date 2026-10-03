import { Component } from '@angular/core';
import { EmvArqcForm, EmvArqcConfig } from '../../shared/emv-arqc-form/emv-arqc-form';
import { DISCOVER_ARQC_FIELDS } from '../discover-test-data';

/**
 * Discover ARQC - Authorization Request Cryptogram (9F26), POST /api/arqc.
 * The form itself is the shared EmvArqcForm (same as Visa and Mastercard), with Discover's five tags.
 */
@Component({
  selector: 'app-arqc-generator',
  imports: [EmvArqcForm],
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class ArqcGenerator {

  readonly config: EmvArqcConfig = {
    title: 'ARQC Generator',
    subtitle: 'Authorization Request Cryptogram — Application Cryptogram (9F26)',
    apiUrl: '/api/arqc',
    fields: DISCOVER_ARQC_FIELDS,
    exampleResult: '37858601E2285A5D'
  };
}
