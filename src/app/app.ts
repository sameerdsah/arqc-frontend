import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { ArqcGenerator } from './discover/arqc-generator/arqc-generator';
import { CvvGenerator } from './discover/cvv-generator/cvv-generator';
import { IcvvGenerator } from './discover/icvv-generator/icvv-generator';
import { DcvvGenerator } from './discover/dcvv-generator/dcvv-generator';
import { ArpcGenerator } from './discover/arpc-generator/arpc-generator';
import { CidGenerator } from './discover/cid-generator/cid-generator';

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

// Turns an address like /discover/cvv into { network, tool, valid }
function parseUrl(url: string): { network: Network; tool: Tool; valid: boolean } {
  const path = url.split(/[?#]/)[0];
  const segments = path.split('/').filter(Boolean).map(s => s.toLowerCase());
  const [networkPart, toolPart] = segments;

  const network = NETWORKS.includes(networkPart as Exclude<Network, null>) ? (networkPart as Network) : null;
  const tool = network && NETWORK_CONFIG[network].tools.some(t => t.slug === toolPart) ? toolPart : null;
  const valid = segments.length <= 2 && (!networkPart || !!network) && (!toolPart || !!tool);

  return valid ? { network, tool, valid } : { network: null, tool: null, valid };
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArqcGenerator, ArpcGenerator, CvvGenerator, CidGenerator, IcvvGenerator, DcvvGenerator],
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

  get isDiscover(): boolean {
    return this.selectedNetwork === 'discover';
  }

  get isArqcFunctional(): boolean {
    return this.isDiscover && this.selectedTool === 'arqc';
  }

  get isArpcFunctional(): boolean {
    return this.isDiscover && this.selectedTool === 'arpc';
  }

  get isCidFunctional(): boolean {
    return this.isDiscover && this.selectedTool === 'cid';
  }

  get isCvvFunctional(): boolean {
    return this.isDiscover && this.selectedTool === 'cvv';
  }

  get isIcvvFunctional(): boolean {
    return this.isDiscover && this.selectedTool === 'icvv';
  }

  get isDcvvFunctional(): boolean {
    return this.isDiscover && this.selectedTool === 'dcvv';
  }

  get isFunctional(): boolean {
    return this.isArqcFunctional || this.isArpcFunctional || this.isCvvFunctional || this.isCidFunctional
      || this.isIcvvFunctional || this.isDcvvFunctional;
  }

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
