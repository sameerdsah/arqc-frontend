import { Component } from '@angular/core';

/** American Express CID - Card Identification Number (4 digits, printed on the front). Not implemented yet: needs the American Express CSC algorithm. */
@Component({
  selector: 'app-amex-cid-generator',
  templateUrl: './cid-generator.html',
  styleUrl: './cid-generator.css'
})
export class AmexCidGenerator {

  title = 'CID Generator';
  subtitle = 'Card Identification Number (4 digits, printed on the front)';
}
