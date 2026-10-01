import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';

/**
 * Visa CVV2 - Card Verification Value 2 (printed on the card).
 * CVV algorithm with service code 000 (applied by the server).
 * The form itself is the shared CardValueGenerator; this page supplies its settings.
 */
@Component({
  selector: 'app-visa-cvv2-generator',
  imports: [CardValueGenerator],
  templateUrl: './cvv2-generator.html',
  styleUrl: './cvv2-generator.css'
})
export class VisaCvv2Generator {

  readonly config: CardValueConfig = {
    title: 'CVV2 Generator',
    subtitle: 'Card Verification Value 2 (printed on the card)',
    valueName: 'CVV2',
    apiUrl: '/api/visa/cvv2',
    needsServiceCode: false
  };
}
