import { Component } from '@angular/core';

/** American Express Chip CSC - Chip Card Security Code (stored in the chip). Not implemented yet: needs the American Express CSC algorithm. */
@Component({
  selector: 'app-amex-chip-csc-generator',
  templateUrl: './chip-csc-generator.html',
  styleUrl: './chip-csc-generator.css'
})
export class AmexChipCscGenerator {

  title = 'Chip CSC Generator';
  subtitle = 'Chip Card Security Code (stored in the chip)';
}
