import { Component, computed, inject } from '@angular/core';
import { RecentChecks } from '../../core/recent/recent-checks.service';
import { outcomeText, timeAgo } from '../../core/recent/recent-checks';
import { NETWORK_CONFIG, NetworkConfig } from '../../navigation/navigation';

/** '/visa/arqc' -> 'Visa ARQC' (the path itself when unknown). */
export function checkLabel(path: string): string {
  const [, network, slug] = path.split('/');
  const config = (NETWORK_CONFIG as Record<string, NetworkConfig>)[network];
  const tool = config?.tools.find(t => t.slug === slug);
  return config && tool ? `${config.shortLabel} ${tool.label}` : path;
}

/**
 * "Recent checks" on the start page: the last checks of a received value made in this browser,
 * each one click away from being run again. Kept in this browser only (localStorage).
 */
@Component({
  selector: 'app-recent-checks-panel',
  templateUrl: './recent-checks-panel.html',
  styleUrl: './recent-checks-panel.css'
})
export class RecentChecksPanel {
  private readonly recent = inject(RecentChecks);

  readonly items = computed(() => this.recent.checks().map(check => ({
    check, label: checkLabel(check.path), outcome: outcomeText(check), when: timeAgo(check.at)
  })));

  clear() {
    this.recent.clear();
  }
}
