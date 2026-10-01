import { Component } from '@angular/core';

/** Visa dCVV - Dynamic Card Verification Value (contactless). Not implemented yet: needs the Visa specification. */
@Component({
  selector: 'app-visa-dcvv-generator',
  templateUrl: './dcvv-generator.html',
  styleUrl: './dcvv-generator.css'
})
export class VisaDcvvGenerator {

  title = 'dCVV Generator';
  subtitle = 'Dynamic Card Verification Value (contactless)';
}
