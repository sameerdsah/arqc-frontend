import { Component } from '@angular/core';

/** American Express ARQC - Authorization Request Cryptogram (9F26). Not implemented yet: needs the AEIPS specification for the Issuer Application Data layout. */
@Component({
  selector: 'app-amex-arqc-generator',
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class AmexArqcGenerator {

  title = 'ARQC Generator';
  subtitle = 'Authorization Request Cryptogram (9F26)';
}
