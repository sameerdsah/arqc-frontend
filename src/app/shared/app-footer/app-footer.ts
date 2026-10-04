import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OTHER_EDITION, releaseText, STATUS_HINT, statusText } from '../../core/release/release';
import { ServiceStatus } from '../../core/release/service-status';
import { isDesktopApp } from '../api-docs-link/api-docs-link';

/**
 * Footer on every page: is the service up, which release is running (from GET /api/health),
 * links to monitoring and the API documentation, and the test-data reminder.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './app-footer.html',
  styleUrl: './app-footer.css'
})
export class AppFooter {
  private readonly service = inject(ServiceStatus);

  readonly state = computed(() => this.service.status().state);
  readonly status = computed(() => statusText(this.service.status()));
  readonly release = computed(() => {
    const s = this.service.status();
    return s.state === 'up' ? releaseText(s.health) : '';
  });
  readonly otherEdition = OTHER_EDITION;
  readonly statusHint = STATUS_HINT;
  readonly online = !isDesktopApp();          // the monitoring and Swagger pages need the server
  readonly year = new Date().getFullYear();
}
