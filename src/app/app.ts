import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArqcGenerator } from './arqc-generator/arqc-generator';

type Network = 'mastercard' | 'visa' | 'discover' | null;
type DiscoverTool = 'arqc' | 'dcvv' | null;

@Component({
  selector: 'app-root',
  imports: [CommonModule, ArqcGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'arqc-generator';

  selectedNetwork: Network = null;
  selectedTool: DiscoverTool = null;

  selectNetwork(network: Network) {
    this.selectedNetwork = network;
    this.selectedTool = null;
  }

  selectTool(tool: DiscoverTool) {
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