import { Component } from '@angular/core';

/** Mastercard CVC3 - Dynamic Card Validation Code (contactless). Not implemented yet: needs the Mastercard specification. */
@Component({
  selector: 'app-mastercard-cvc3-generator',
  templateUrl: './cvc3-generator.html',
  styleUrl: './cvc3-generator.css'
})
export class MastercardCvc3Generator {

  title = 'CVC3 Generator';
  subtitle = 'Dynamic Card Validation Code (contactless)';
}
