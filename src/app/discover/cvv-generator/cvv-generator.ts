import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';
import { DISCOVER_TEST_CARD } from '../discover-test-data';

/**
 * Discover CVV - Card Verification Value (magnetic stripe), POST /api/cvv.
 * The form itself is the shared CardValueGenerator (same as Visa and Mastercard); this page supplies its settings.
 */
@Component({
  selector: 'app-cvv-generator',
  imports: [CardValueGenerator],
  templateUrl: './cvv-generator.html',
  styleUrl: './cvv-generator.css'
})
export class CvvGenerator {

  readonly config: CardValueConfig = {
    title: 'CVV Generator',
    subtitle: 'Card Verification Value',
    valueName: 'CVV',
    apiUrl: '/api/cvv',
    needsServiceCode: true,
    example: DISCOVER_TEST_CARD
  };
}
