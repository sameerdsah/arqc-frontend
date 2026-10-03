import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavLink } from '../../navigation/navigation';

/**
 * Where am I, and where else can I go: a breadcrumb (Home > Visa > ARQC) and, on value pages,
 * a row of the network's other values to switch in one click (Visa ARQC -> Visa ARPC).
 */
@Component({
  selector: 'app-page-nav',
  imports: [RouterLink],
  templateUrl: './page-nav.html',
  styleUrl: './page-nav.css'
})
export class PageNav {
  readonly crumbs = input.required<NavLink[]>();
  readonly switcher = input<NavLink[]>([]);
}
