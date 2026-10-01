import { Component } from '@angular/core';

/** Mastercard ARPC - Authorization Response Cryptogram. Not implemented yet: needs the Mastercard specification. */
@Component({
  selector: 'app-mastercard-arpc-generator',
  templateUrl: './arpc-generator.html',
  styleUrl: './arpc-generator.css'
})
export class MastercardArpcGenerator {

  title = 'ARPC Generator';
  subtitle = 'Authorization Response Cryptogram';
}
