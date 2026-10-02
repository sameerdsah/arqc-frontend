import { Component, Type, computed, inject } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
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
import { ApiDocsLink } from './shared/api-docs-link/api-docs-link';
import { TestingToolsMenu } from './tools/testing-tools-menu/testing-tools-menu';
import { findTestingTool } from './tools/testing-tools';

type Network = 'discover' | 'mastercard' | 'visa' | 'amex' | null;
type Tool = string | null;

// One entry per button on a network page. `slug` is the address (e.g. /mastercard/cvc2),
// `label` is the button text and `name` is the full name shown as the page subtitle.
interface ToolOption {
  slug: string;
  label: string;
  name: string;
}

interface NetworkConfig {
  label: string;
  platform: string;
  tools: ToolOption[];
}

// Each network lists the same six kinds of value, in the same order, using that
// network's own names: chip cryptogram, issuer response, stripe value,
// printed value, chip value (service code 999) and contactless dynamic value.
const NETWORK_CONFIG: Record<Exclude<Network, null>, NetworkConfig> = {
  discover: {
    label: 'Discover',
    platform: 'D-PAS',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'cvv', label: 'CVV', name: 'Card Verification Value (magnetic stripe)' },
      { slug: 'cid', label: 'CID', name: 'Card Identification Number (printed on the card)' },
      { slug: 'icvv', label: 'iCVV', name: 'Integrated Card Verification Value (stored in the chip)' },
      { slug: 'dcvv', label: 'DCVV', name: 'Dynamic Card Verification Value (contactless)' }
    ]
  },
  mastercard: {
    label: 'Mastercard',
    platform: 'M/Chip',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'cvc1', label: 'CVC1', name: 'Card Validation Code 1 (magnetic stripe)' },
      { slug: 'cvc2', label: 'CVC2', name: 'Card Validation Code 2 (printed on the card)' },
      { slug: 'chip-cvc', label: 'Chip CVC', name: 'Chip Card Validation Code (stored in the chip)' },
      { slug: 'cvc3', label: 'CVC3', name: 'Dynamic Card Validation Code (contactless)' }
    ]
  },
  visa: {
    label: 'Visa',
    platform: 'VSDC / qVSDC',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'cvv', label: 'CVV', name: 'Card Verification Value (magnetic stripe)' },
      { slug: 'cvv2', label: 'CVV2', name: 'Card Verification Value 2 (printed on the card)' },
      { slug: 'icvv', label: 'iCVV', name: 'Integrated Card Verification Value (stored in the chip)' },
      { slug: 'dcvv', label: 'dCVV', name: 'Dynamic Card Verification Value (contactless)' }
    ]
  },
  amex: {
    label: 'American Express',
    platform: 'AEIPS / Expresspay',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'csc', label: 'CSC', name: 'Card Security Code (magnetic stripe)' },
      { slug: 'cid', label: 'CID', name: 'Card Identification Number (4 digits, printed on the front)' },
      { slug: 'chip-csc', label: 'Chip CSC', name: 'Chip Card Security Code (stored in the chip)' },
      { slug: 'dynamic-csc', label: 'Dynamic CSC', name: 'Expresspay dynamic value (contactless)' }
    ]
  }
};

const NETWORKS: Exclude<Network, null>[] = ['discover', 'mastercard', 'visa', 'amex'];

// Which page (component) is shown for each address, e.g. /visa/cvv2.
// Each network has its own folder with one sub-folder per page.
// An address without an entry here shows the generic "Under Maintenance" page.
const PAGE_COMPONENTS: Record<string, Type<unknown>> = {
  'discover/arqc': ArqcGenerator,
  'discover/arpc': ArpcGenerator,
  'discover/cvv': CvvGenerator,
  'discover/cid': CidGenerator,
  'discover/icvv': IcvvGenerator,
  'discover/dcvv': DcvvGenerator,

  'mastercard/arqc': MastercardArqcGenerator,
  'mastercard/arpc': MastercardArpcGenerator,
  'mastercard/cvc1': MastercardCvc1Generator,
  'mastercard/cvc2': MastercardCvc2Generator,
  'mastercard/chip-cvc': MastercardChipCvcGenerator,
  'mastercard/cvc3': MastercardCvc3Generator,

  'visa/arqc': VisaArqcGenerator,
  'visa/arpc': VisaArpcGenerator,
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

interface ParsedUrl {
  network: Network;
  tool: Tool;
  testingTool: string | null;   // /tools/verify, /tools/batch
  valid: boolean;
}

// Turns an address like /discover/cvv or /tools/verify into { network, tool, testingTool, valid }
function parseUrl(url: string): ParsedUrl {
  const path = url.split(/[?#]/)[0];
  const segments = path.split('/').filter(Boolean).map(s => s.toLowerCase());
  const [networkPart, toolPart] = segments;

  if (networkPart === 'tools') {
    const testingTool = segments.length === 2 ? findTestingTool(toolPart) : null;
    return { network: null, tool: null, testingTool: testingTool?.slug ?? null, valid: !!testingTool };
  }

  const network = NETWORKS.includes(networkPart as Exclude<Network, null>) ? (networkPart as Network) : null;
  const tool = network && NETWORK_CONFIG[network].tools.some(t => t.slug === toolPart) ? toolPart : null;
  const valid = segments.length <= 2 && (!networkPart || !!network) && (!toolPart || !!tool);

  return valid ? { network, tool, testingTool: null, valid } : { network: null, tool: null, testingTool: null, valid };
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgComponentOutlet, ApiDocsLink, TestingToolsMenu],
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

  goBackToNetworks() {
    this.router.navigate(['/']);
  }

  goBackToTools() {
    this.router.navigate(this.selectedNetwork ? ['/', this.selectedNetwork] : ['/']);
  }
}
