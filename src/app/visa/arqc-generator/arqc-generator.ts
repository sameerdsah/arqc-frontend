import { Component } from '@angular/core';

/** Visa ARQC - Authorization Request Cryptogram (9F26). Not implemented yet: needs the Visa specification. */
@Component({
  selector: 'app-visa-arqc-generator',
  templateUrl: './arqc-generator.html',
  styleUrl: './arqc-generator.css'
})
export class VisaArqcGenerator {

  title = 'ARQC Generator';
  subtitle = 'Authorization Request Cryptogram (9F26)';
}
