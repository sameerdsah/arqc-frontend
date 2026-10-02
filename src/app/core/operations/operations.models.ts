/** Types for the operation catalogue API (GET /api/operations, POST /api/verify, POST /api/batch). */

export interface OperationField {
  name: string;      // JSON / CSV name, e.g. 'tag_9f02'
  label: string;     // e.g. 'Tag 9F02 (Amount, Authorized)'
  example: string;   // valid test value
}

export interface OperationInfo {
  id: string;              // e.g. 'visa/cvv2'
  network: string;         // e.g. 'visa'
  network_label: string;   // e.g. 'Visa'
  label: string;           // e.g. 'Visa CVV2'
  type: string;            // e.g. 'CVV2'
  path: string;            // single-value endpoint, e.g. '/api/visa/cvv2'
  result_format: string;   // e.g. '3 digits'
  result_pattern: string;  // e.g. '^[0-9]{3}$'
  fields: OperationField[];
}

export interface OperationCatalogue {
  operations: OperationInfo[];
  max_batch_items: number;
}

export interface VerifyRequest {
  operation: string;
  input: Record<string, string>;
  received: string;
}

export interface VerifyResult {
  operation: string;
  type: string;
  valid: boolean;
  expected: string;
  received: string;
}

export interface BatchItem {
  ref?: string;
  input: Record<string, string>;
  received?: string;
}

export interface BatchRequest {
  operation: string;
  items: BatchItem[];
}

export interface BatchItemResult {
  index: number;
  ref?: string;
  result?: string;
  received?: string;
  valid?: boolean;
  error?: string;
}

export interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
  matched?: number;
  mismatched?: number;
}

export interface BatchResult {
  operation: string;
  type: string;
  summary: BatchSummary;
  results: BatchItemResult[];
}

export interface OperationGroup {
  label: string;               // network, e.g. 'Visa'
  operations: OperationInfo[];
}

/** Groups operations by network for a <select> with <optgroup>s, keeping the catalogue order. */
export function groupByNetwork(operations: OperationInfo[]): OperationGroup[] {
  const groups = new Map<string, OperationGroup>();
  for (const op of operations) {
    if (!groups.has(op.network)) {
      groups.set(op.network, { label: op.network_label, operations: [] });
    }
    groups.get(op.network)!.operations.push(op);
  }
  return [...groups.values()];
}
