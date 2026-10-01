import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';

/**
 * Visa CVV - Card Verification Value (magnetic stripe).
 * CVV algorithm with the card's own service code (entered by the user).
 * The form itself is the shared CardValueGenerator; this page supplies its settings.
 */
@Component({
  selector: 'app-visa-cvv-generator',
  imports: [CardValueGenerator],
  templateUrl: './cvv-generator.html',
  styleUrl: './cvv-generator.css'
})
export class VisaCvvGenerator {

  readonly config: CardValueConfig = {
    title: 'CVV Generator',
    subtitle: 'Card Verification Value (magnetic stripe)',
    valueName: 'CVV',
    apiUrl: '/api/visa/cvv',
    needsServiceCode: true
  };
}
