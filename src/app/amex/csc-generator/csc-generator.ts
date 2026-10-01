import { Component } from '@angular/core';

/** American Express CSC - Card Security Code (magnetic stripe). Not implemented yet: needs the American Express CSC algorithm. */
@Component({
  selector: 'app-amex-csc-generator',
  templateUrl: './csc-generator.html',
  styleUrl: './csc-generator.css'
})
export class AmexCscGenerator {

  title = 'CSC Generator';
  subtitle = 'Card Security Code (magnetic stripe)';
}
