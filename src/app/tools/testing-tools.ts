import { Type } from '@angular/core';
import { VerifyValue } from './verify-value/verify-value';
import { BatchGeneration } from './batch-generation/batch-generation';

/** Cross-network testing tools, shown under "Testing Tools" on the start page (/tools/<slug>). */
export interface TestingTool {
  slug: string;
  label: string;
  description: string;
  component: Type<unknown>;
}

export const TESTING_TOOLS: TestingTool[] = [
  { slug: 'verify', label: 'Verify a Value', description: 'Check an ARQC, ARPC or CVV you received: Match or No match, and the likely cause', component: VerifyValue },
  { slug: 'batch', label: 'Batch Generation', description: 'Generate or verify up to 500 values from a CSV file', component: BatchGeneration }
];

export function findTestingTool(slug: string | undefined): TestingTool | null {
  return TESTING_TOOLS.find(t => t.slug === slug) ?? null;
}
