import { Component, Type, computed, effect, inject } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
// Discover
import { ArqcGenerator } from './discover/arqc-generator/arqc-generator';
import { ArpcGenerator } from './discover/arpc-generator/arpc-generator';
import { CvvGenerator } from './discover/cvv-generator/cvv-generator';
import { CidGenerator } from './discover/cid-generator/cid-generator';
import { IcvvGenerator } from './discover/icvv-generator/icvv-generator';
import { DcvvGenerator } from './discover/dcvv-generator/dcvv-generator';
// Mastercard
import { MastercardArqcGenerator } from './mastercard/arqc-generator/arqc-generator';
import { MastercardArpcGenerator } from './mastercard/arpc-generator/arpc-generator';
import { MastercardCvc1Generator } from './mastercard/cvc1-generator/cvc1-generator';
import { MastercardCvc2Generator } from './mastercard/cvc2-generator/cvc2-generator';
import { MastercardChipCvcGenerator } from './mastercard/chip-cvc-generator/chip-cvc-generator';
import { MastercardCvc3Generator } from './mastercard/cvc3-generator/cvc3-generator';
// Visa
import { VisaArqcGenerator } from './visa/arqc-generator/arqc-generator';
import { VisaArpcGenerator } from './visa/arpc-generator/arpc-generator';
import { VisaCvvGenerator } from './visa/cvv-generator/cvv-generator';
import { VisaCvv2Generator } from './visa/cvv2-generator/cvv2-generator';
import { VisaIcvvGenerator } from './visa/icvv-generator/icvv-generator';
import { VisaDcvvGenerator } from './visa/dcvv-generator/dcvv-generator';
// American Express
import { AmexArqcGenerator } from './amex/arqc-generator/arqc-generator';
import { AmexArpcGenerator } from './amex/arpc-generator/arpc-generator';
import { AmexCscGenerator } from './amex/csc-generator/csc-generator';
import { AmexCidGenerator } from './amex/cid-generator/cid-generator';
import { AmexChipCscGenerator } from './amex/chip-csc-generator/chip-csc-generator';
import { AmexDynamicCscGenerator } from './amex/dynamic-csc-generator/dynamic-csc-generator';
import { DiscoverAacGenerator, DiscoverTcGenerator } from './discover/tc-aac-generators/tc-aac-generators';
import { VisaAacGenerator, VisaTcGenerator } from './visa/tc-aac-generators/tc-aac-generators';
import { MastercardAacGenerator, MastercardTcGenerator } from './mastercard/tc-aac-generators/tc-aac-generators';
import { AppHeader } from './shared/app-header/app-header';
import { PageNav } from './shared/page-nav/page-nav';
import { TestingToolsMenu } from './tools/testing-tools-menu/testing-tools-menu';
import { AppFooter } from './shared/app-footer/app-footer';
import { LearnPage } from './learn/learn-page/learn-page';
import { RecentChecksPanel } from './shared/recent-checks-panel/recent-checks-panel';
import { findTestingTool } from './tools/testing-tools';
import {
  breadcrumb, headerLinks, Network, NETWORK_CONFIG, NetworkConfig, NETWORKS, pageTitle, parseUrl, Tool, ToolOption,
  valueSwitcher
} from './navigation/navigation';

// Which page (component) is shown for each address, e.g. /visa/cvv2.
// Each network has its own folder with one sub-folder per page.
// An address without an entry here shows the generic "Under Maintenance" page.
const PAGE_COMPONENTS: Record<string, Type<unknown>> = {
  'discover/arqc': ArqcGenerator,
  'discover/arpc': ArpcGenerator,
  'discover/tc': DiscoverTcGenerator,
  'discover/aac': DiscoverAacGenerator,
  'discover/cvv': CvvGenerator,
  'discover/cid': CidGenerator,
  'discover/icvv': IcvvGenerator,
  'discover/dcvv': DcvvGenerator,

  'mastercard/arqc': MastercardArqcGenerator,
  'mastercard/arpc': MastercardArpcGenerator,
  'mastercard/tc': MastercardTcGenerator,
  'mastercard/aac': MastercardAacGenerator,
  'mastercard/cvc1': MastercardCvc1Generator,
  'mastercard/cvc2': MastercardCvc2Generator,
  'mastercard/chip-cvc': MastercardChipCvcGenerator,
  'mastercard/cvc3': MastercardCvc3Generator,

  'visa/arqc': VisaArqcGenerator,
  'visa/arpc': VisaArpcGenerator,
  'visa/tc': VisaTcGenerator,
  'visa/aac': VisaAacGenerator,
  'visa/cvv': VisaCvvGenerator,
  'visa/cvv2': VisaCvv2Generator,
  'visa/icvv': VisaIcvvGenerator,
  'visa/dcvv': VisaDcvvGenerator,

  'amex/arqc': AmexArqcGenerator,
  'amex/arpc': AmexArpcGenerator,
  'amex/csc': AmexCscGenerator,
  'amex/cid': AmexCidGenerator,
  'amex/chip-csc': AmexChipCscGenerator,
  'amex/dynamic-csc': AmexDynamicCscGenerator
};

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgComponentOutlet, AppHeader, PageNav, TestingToolsMenu, AppFooter, LearnPage, RecentChecksPanel],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  title = 'cryptogram-generator';
  networks = NETWORKS;
  networkConfig = NETWORK_CONFIG;

  // The current address as a signal: Angular redraws the page whenever it
  // changes - including the browser's Back/Forward buttons.
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  private route = computed(() => parseUrl(this.currentUrl()));

  // Navigation, all derived from the address and the site map (navigation.ts)
  readonly header = computed(() => headerLinks(this.route()));
  readonly crumbs = computed(() => breadcrumb(this.route()));
  readonly switcher = computed(() => valueSwitcher(this.route()));
  readonly isHome = computed(() => !this.route().network && !this.route().testingTool && !this.route().learn);
  readonly learn = computed(() => this.route().learn);
  readonly guide = computed(() => this.route().guide);

  // The page shown is always worked out from the address bar
  get selectedNetwork(): Network {
    return this.route().network;
  }

  get selectedTool(): Tool {
    return this.route().tool;
  }

  get selectedTestingTool(): string | null {
    return this.route().testingTool;
  }

  get selectedNetworkConfig(): NetworkConfig | null {
    return this.selectedNetwork ? NETWORK_CONFIG[this.selectedNetwork] : null;
  }

  get selectedToolOption(): ToolOption | null {
    const config = this.selectedNetworkConfig;
    return config?.tools.find(t => t.slug === this.selectedTool) ?? null;
  }

  get selectedToolLabel(): string {
    return this.selectedToolOption?.label ?? '';
  }

  get selectedToolName(): string {
    return this.selectedToolOption?.name ?? '';
  }

  constructor() {
    // Browser tab title follows the page, e.g. "Visa ARQC · Cryptogram Generator"
    const title = inject(Title);
    effect(() => title.setTitle(pageTitle(this.route())));

    // Unknown address (e.g. /abc or /discover/xyz) -> go to the start page
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        if (!parseUrl(this.router.url).valid) {
          this.router.navigate(['/'], { replaceUrl: true });
        }
      });
  }

  // The component for the current address, or null (start page, network page, or not built yet)
  readonly pageComponent = computed<Type<unknown> | null>(() => {
    const { network, tool, testingTool } = this.route();
    if (testingTool) {
      return findTestingTool(testingTool)?.component ?? null;
    }
    return network && tool ? PAGE_COMPONENTS[`${network}/${tool}`] ?? null : null;
  });

  // Buttons change the address; the page follows automatically
  selectNetwork(network: Network) {
    this.router.navigate(network ? ['/', network] : ['/']);
  }

  selectTool(tool: Tool) {
    if (!this.selectedNetwork || !tool) {
      return;
    }
    this.router.navigate(['/', this.selectedNetwork, tool]);
  }
}
