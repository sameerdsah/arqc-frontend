import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { ArqcGenerator } from './discover/arqc-generator/arqc-generator';
import { CvvGenerator } from './discover/cvv-generator/cvv-generator';
import { IcvvGenerator } from './discover/icvv-generator/icvv-generator';
import { DcvvGenerator } from './discover/dcvv-generator/dcvv-generator';

type Network = 'mastercard' | 'visa' | 'discover' | null;
type Tool = 'arqc' | 'cvv' | 'icvv' | 'dcvv' | null;

const NETWORKS: Network[] = ['discover', 'mastercard', 'visa'];
const TOOLS: Tool[] = ['arqc', 'cvv', 'icvv', 'dcvv'];

// How each tool is written on buttons and headings
const TOOL_LABELS: Record<Exclude<Tool, null>, string> = {
  arqc: 'ARQC',
  cvv: 'CVV',
  icvv: 'iCVV',
  dcvv: 'DCVV'
};

// Turns an address like /discover/cvv into { network, tool, valid }
function parseUrl(url: string): { network: Network; tool: Tool; valid: boolean } {
  const path = url.split(/[?#]/)[0];
  const segments = path.split('/').filter(Boolean).map(s => s.toLowerCase());
  const [networkPart, toolPart] = segments;

  const network = NETWORKS.includes(networkPart as Network) ? (networkPart as Network) : null;
  const tool = network && TOOLS.includes(toolPart as Tool) ? (toolPart as Tool) : null;
  const valid = segments.length <= 2 && (!networkPart || !!network) && (!toolPart || !!tool);

  return valid ? { network, tool, valid } : { network: null, tool: null, valid };
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArqcGenerator, CvvGenerator, IcvvGenerator, DcvvGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  title = 'cryptogram-generator';
  tools = TOOLS;
  toolLabels = TOOL_LABELS;

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

  get selectedToolLabel(): string {
    return this.selectedTool ? TOOL_LABELS[this.selectedTool] : '';
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
    return this.isArqcFunctional || this.isCvvFunctional || this.isIcvvFunctional || this.isDcvvFunctional;
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
