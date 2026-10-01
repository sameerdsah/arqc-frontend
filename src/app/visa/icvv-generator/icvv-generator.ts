import { Component } from '@angular/core';
import { CardValueGenerator, CardValueConfig } from '../../shared/card-value-generator/card-value-generator';

/**
 * Visa iCVV - Integrated Card Verification Value (stored in the chip).
 * CVV algorithm with service code 999 (applied by the server).
 * The form itself is the shared CardValueGenerator; this page supplies its settings.
 */
@Component({
  selector: 'app-visa-icvv-generator',
  imports: [CardValueGenerator],
  templateUrl: './icvv-generator.html',
  styleUrl: './icvv-generator.css'
})
export class VisaIcvvGenerator {

  readonly config: CardValueConfig = {
    title: 'iCVV Generator',
    subtitle: 'Integrated Card Verification Value (stored in the chip)',
    valueName: 'iCVV',
    apiUrl: '/api/visa/icvv',
    needsServiceCode: false
  };
}
