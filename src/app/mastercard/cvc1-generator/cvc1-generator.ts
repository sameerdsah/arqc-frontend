import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';

/**
 * Mastercard CVC1 - Card Validation Code 1 (magnetic stripe).
 * CVV algorithm with the card's own service code (entered by the user).
 * The form itself is the shared CardValueGenerator; this page supplies its settings.
 */
@Component({
  selector: 'app-mastercard-cvc1-generator',
  imports: [CardValueGenerator],
  templateUrl: './cvc1-generator.html',
  styleUrl: './cvc1-generator.css'
})
export class MastercardCvc1Generator {

  readonly config: CardValueConfig = {
    title: 'CVC1 Generator',
    subtitle: 'Card Validation Code 1 (magnetic stripe)',
    valueName: 'CVC1',
    apiUrl: '/api/mastercard/cvc1',
    needsServiceCode: true
  };
}
