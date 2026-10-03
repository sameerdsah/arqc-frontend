import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';
import { DISCOVER_TEST_CARD } from '../discover-test-data';

/**
 * Discover iCVV - Integrated Card Verification Value (stored in the chip), POST /api/icvv.
 * The form itself is the shared CardValueGenerator (same as Visa and Mastercard); this page supplies its settings.
 */
@Component({
  selector: 'app-icvv-generator',
  imports: [CardValueGenerator],
  templateUrl: './icvv-generator.html',
  styleUrl: './icvv-generator.css'
})
export class IcvvGenerator {

  readonly config: CardValueConfig = {
    title: 'iCVV Generator',
    subtitle: 'Integrated Card Verification Value (stored in the chip)',
    valueName: 'iCVV',
    apiUrl: '/api/icvv',
    needsServiceCode: false,
    example: DISCOVER_TEST_CARD
  };
}
