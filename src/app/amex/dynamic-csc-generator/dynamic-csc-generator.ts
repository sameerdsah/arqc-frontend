import { Component } from '@angular/core';

/** American Express Dynamic CSC - Expresspay dynamic value (contactless). Not implemented yet: needs the Expresspay specification. */
@Component({
  selector: 'app-amex-dynamic-csc-generator',
  templateUrl: './dynamic-csc-generator.html',
  styleUrl: './dynamic-csc-generator.css'
})
export class AmexDynamicCscGenerator {

  title = 'Dynamic CSC Generator';
  subtitle = 'Expresspay dynamic value (contactless)';
}
