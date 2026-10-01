import { Component } from '@angular/core';

/** Mastercard ARQC - Authorization Request Cryptogram (9F26). Not implemented yet: needs the Mastercard specification. */
@Component({
  selector: 'app-mastercard-arqc-generator',
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class MastercardArqcGenerator {

  title = 'ARQC Generator';
  subtitle = 'Authorization Request Cryptogram (9F26)';
}
