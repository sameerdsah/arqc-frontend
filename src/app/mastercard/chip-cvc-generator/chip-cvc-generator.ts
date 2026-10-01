import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';

/**
 * Mastercard Chip CVC - Chip Card Validation Code (stored in the chip).
 * CVV algorithm with service code 999 (applied by the server).
 * The form itself is the shared CardValueGenerator; this page supplies its settings.
 */
@Component({
  selector: 'app-mastercard-chip-cvc-generator',
  imports: [CardValueGenerator],
  templateUrl: './chip-cvc-generator.html',
  styleUrl: './chip-cvc-generator.css'
})
export class MastercardChipCvcGenerator {

  readonly config: CardValueConfig = {
    title: 'Chip CVC Generator',
    subtitle: 'Chip Card Validation Code (stored in the chip)',
    valueName: 'Chip CVC',
    apiUrl: '/api/mastercard/chip-cvc',
    needsServiceCode: false
  };
}
