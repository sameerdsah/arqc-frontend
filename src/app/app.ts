import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { ArqcGenerator } from './discover/arqc-generator/arqc-generator';
import { ArpcGenerator } from './discover/arpc-generator/arpc-generator';
import { TcGenerator } from './discover/tc-generator/tc-generator';
import { AacGenerator } from './discover/aac-generator/aac-generator';

type Network = 'mastercard' | 'visa' | 'discover' | null;
type Tool = 'cryptogram' | 'arpc' | 'tc' | 'aac' | null;

const NETWORKS: Network[] = ['discover', 'mastercard', 'visa'];

// Tool name in the code  <->  word in the address bar
const TOOL_TO_URL: Record<Exclude<Tool, null>, string> = {
  cryptogram: 'arqc',
  arpc: 'arpc',
  tc: 'tc',
  aac: 'aac'
};
const URL_TO_TOOL: Record<string, Tool> = {
  arqc: 'cryptogram',
  arpc: 'arpc',
  tc: 'tc',
  aac: 'aac'
};

// Turns an address like /discover/arqc into { network, tool, valid }
function parseUrl(url: string): { network: Network; tool: Tool; valid: boolean } {
  const path = url.split(/[?#]/)[0];
  const segments = path.split('/').filter(Boolean).map(s => s.toLowerCase());
  const [networkPart, toolPart] = segments;

  const network = NETWORKS.includes(networkPart as Network) ? (networkPart as Network) : null;
  const tool = network && toolPart ? (URL_TO_TOOL[toolPart] ?? null) : null;
  const valid = segments.length <= 2 && (!networkPart || !!network) && (!toolPart || !!tool);

  return valid ? { network, tool, valid } : { network: null, tool: null, valid };
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArqcGenerator, ArpcGenerator, TcGenerator, AacGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  title = 'cryptogram-generator';

  // The current address, kept as a signal. Angular automatically redraws the
  // page whenever it changes - including the browser's Back/Forward buttons.
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

  get isStandardCryptogramFunctional(): boolean {
    return this.selectedNetwork === 'discover' && this.selectedTool === 'cryptogram';
  }

  get isTcFunctional(): boolean {
    return this.selectedNetwork === 'discover' && this.selectedTool === 'tc';
  }

  get isAacFunctional(): boolean {
    return this.selectedNetwork === 'discover' && this.selectedTool === 'aac';
  }

  get isArpcFunctional(): boolean {
    return this.selectedNetwork === 'discover' && this.selectedTool === 'arpc';
  }

  get isFunctional(): boolean {
    return this.isStandardCryptogramFunctional || this.isTcFunctional || this.isAacFunctional || this.isArpcFunctional;
  }

  // Buttons change the address; the page follows automatically
  selectNetwork(network: Network) {
    this.router.navigate(network ? ['/', network] : ['/']);
  }

  selectTool(tool: Tool) {
    if (!this.selectedNetwork || !tool) {
      return;
    }
    this.router.navigate(['/', this.selectedNetwork, TOOL_TO_URL[tool]]);
  }

  goBackToNetworks() {
    this.router.navigate(['/']);
  }

  goBackToTools() {
    this.router.navigate(this.selectedNetwork ? ['/', this.selectedNetwork] : ['/']);
  }
}
