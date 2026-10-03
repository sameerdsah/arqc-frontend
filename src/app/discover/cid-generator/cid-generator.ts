import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';
import { DISCOVER_TEST_CARD } from '../discover-test-data';

/**
 * Discover CID - Card Identification Number (printed on the card), POST /api/cid.
 * The form itself is the shared CardValueGenerator (same as Visa and Mastercard); this page supplies its settings.
 */
@Component({
  selector: 'app-cid-generator',
  imports: [CardValueGenerator],
  templateUrl: './cid-generator.html',
  styleUrl: './cid-generator.css'
})
export class CidGenerator {

  readonly config: CardValueConfig = {
    title: 'CID Generator',
    subtitle: 'Card Identification Number (printed on the card)',
    valueName: 'CID',
    apiUrl: '/api/cid',
    needsServiceCode: false,
    example: DISCOVER_TEST_CARD
  };
}
