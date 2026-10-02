import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TESTING_TOOLS } from '../testing-tools';

/** "Testing Tools" buttons on the start page, below the card networks. */
@Component({
  selector: 'app-testing-tools-menu',
  templateUrl: './testing-tools-menu.html',
  styleUrl: './testing-tools-menu.css'
})
export class TestingToolsMenu {
  private readonly router = inject(Router);
  readonly tools = TESTING_TOOLS;

  open(slug: string) {
    this.router.navigate(['/tools', slug]);
  }
}
