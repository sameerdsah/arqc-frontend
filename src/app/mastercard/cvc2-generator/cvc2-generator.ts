import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';

/**
 * Mastercard CVC2 - Card Validation Code 2 (printed on the card).
 * CVV algorithm with service code 000 (applied by the server).
 * The form itself is the shared CardValueGenerator; this page supplies its settings.
 */
@Component({
  selector: 'app-mastercard-cvc2-generator',
  imports: [CardValueGenerator],
  templateUrl: './cvc2-generator.html',
  styleUrl: './cvc2-generator.css'
})
export class MastercardCvc2Generator {

  readonly config: CardValueConfig = {
    title: 'CVC2 Generator',
    subtitle: 'Card Validation Code 2 (printed on the card)',
    valueName: 'CVC2',
    apiUrl: '/api/mastercard/cvc2',
    needsServiceCode: false
  };
}
