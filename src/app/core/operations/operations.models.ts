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
  example_result?: string; // result of the example input, e.g. '597'
}

export interface OperationCatalogue {
  operations: OperationInfo[];
  max_batch_items: number;
}

export interface VerifyRequest {
  operation: string;
  input: Record<string, string>;
  received: string;
  diagnose?: boolean;      // explain a mismatch (Mismatch Explainer); counts as 2 requests
}

export interface VerifyResult {
  operation: string;
  type: string;
  valid: boolean;
  expected: string;
  received: string;
  diagnosis?: Diagnosis;   // only when diagnose was requested and the value does not match
}

/** One input change that reproduces the received value, e.g. 9F36 0001 -> 0002. */
export interface DiagnosisChange {
  field: string;           // API field name, e.g. 'tag_9f36'
  label: string;           // e.g. 'Tag 9F36 (Application Transaction Counter)'
  from: string;
  to: string;
}

/** The most likely cause of a mismatch, found by recalculating well-known mistakes. */
export interface DiagnosisFinding {
  cause: string;                       // e.g. 'atc-drift', 'other-value', 'received-is-input'
  explanation: string;                 // plain English, ready to show
  confidence: 'certain' | 'possible';  // 'possible' for short values (3 digits) that can match by chance
  note?: string;
  changes: DiagnosisChange[];          // empty when the input is right but the value is something else
  operation?: { id: string; label: string; type: string };   // the received value is this other value of the card
}

export interface Diagnosis {
  checked: number;                     // variants recalculated
  findings: DiagnosisFinding[];        // empty: none of the known causes explains it
}

/** What a generator page calculated, and from which input (the basis of a received-value check). */
export interface Calculation {
  input: Record<string, string>;
  result: string;
}

/** State of the explanation of a mismatch, as shown to the user. */
export type Explanation =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; diagnosis: Diagnosis }
  | { status: 'error'; message: string };

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
