import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArqcGenerator } from './discover/arqc-generator/arqc-generator';
import { ArpcGenerator } from './discover/arpc-generator/arpc-generator';

type Network = 'mastercard' | 'visa' | 'discover' | null;
type Tool = 'cryptogram' | 'arpc' | 'tc' | 'aac' | null;

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArqcGenerator, ArpcGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'cryptogram-generator';

  selectedNetwork: Network = null;
  selectedTool: Tool = null;

  get isStandardCryptogramFunctional(): boolean {
    return this.selectedNetwork === 'discover' &&
      (this.selectedTool === 'cryptogram' || this.selectedTool === 'tc' || this.selectedTool === 'aac');
  }

  get isArpcFunctional(): boolean {
    return this.selectedNetwork === 'discover' && this.selectedTool === 'arpc';
  }

  get isFunctional(): boolean {
    return this.isStandardCryptogramFunctional || this.isArpcFunctional;
  }

  get toolApiUrl(): string {
    switch (this.selectedTool) {
      case 'tc': return '/api/tc';
      case 'aac': return '/api/aac';
      default: return '/api/save';
    }
  }

  get toolResultPrefix(): string {
    switch (this.selectedTool) {
      case 'tc': return 'The computed TC is:';
      case 'aac': return 'The computed AAC is:';
      default: return 'The computed ARQC is:';
    }
  }

  get toolTitle(): string {
    switch (this.selectedTool) {
      case 'tc': return 'TC Generator';
      case 'aac': return 'AAC Generator';
      default: return 'ARQC Generator';
    }
  }

  selectNetwork(network: Network) {
    this.selectedNetwork = network;
    this.selectedTool = null;
  }

  selectTool(tool: Tool) {
    this.selectedTool = tool;
  }

  goBackToNetworks() {
    this.selectedNetwork = null;
    this.selectedTool = null;
  }

  goBackToTools() {
    this.selectedTool = null;
  }
}