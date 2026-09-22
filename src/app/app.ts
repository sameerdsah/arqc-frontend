import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptogramGenerator } from './cryptogram-generator/cryptogram-generator';

type Network = 'mastercard' | 'visa' | 'discover' | null;
type Tool = 'cryptogram' | 'arpc' | 'tc' | 'aac' | null;

@Component({
  selector: 'app-root',
  imports: [CommonModule, CryptogramGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'cryptogram-generator';

  selectedNetwork: Network = null;
  selectedTool: Tool = null;

  get isFunctional(): boolean {
    return this.selectedNetwork === 'discover' && this.selectedTool === 'cryptogram';
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