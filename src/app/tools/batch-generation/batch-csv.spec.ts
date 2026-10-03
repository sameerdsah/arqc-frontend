import { OperationInfo } from '../../core/operations/operations.models';
import { buildTemplate, csvToBatchItems, fixText, itemCause, itemStatus, resultsToCsv, sampleRows } from './batch-csv';

const VISA_CVV2: OperationInfo = {
  id: 'visa/cvv2', network: 'visa', network_label: 'Visa', label: 'Visa CVV2', type: 'CVV2',
  path: '/api/visa/cvv2', result_format: '3 digits', result_pattern: '^[0-9]{3}$',
  fields: [{ name: 'pan', label: 'Tag 5A (PAN)', example: '4111111111111111' },
           { name: 'expiry', label: 'Expiry Date (YYMM)', example: '3012' }]
};

describe('batch CSV mapping', () => {
  it('builds a template with ref, the input fields, received and an example row', () => {
    expect(buildTemplate(VISA_CVV2)).toEqual([['ref', 'pan', 'expiry', 'received'], ['row-1', '4111111111111111', '3012', '']]);
  });

  it('turns rows into batch items, in any column order and case', () => {
    const parsed = csvToBatchItems([['Expiry', 'PAN', 'Received', 'note'], ['3012', '4111111111111111', '597', 'x'],
                                    [' 3012 ', '4111111111111111', '', '']], VISA_CVV2, 500);
    expect(parsed.errors).toEqual([]);
    expect(parsed.ignoredColumns).toEqual(['note']);
    expect(parsed.items).toEqual([
      { ref: 'row-1', input: { pan: '4111111111111111', expiry: '3012' }, received: '597' },
      { ref: 'row-2', input: { pan: '4111111111111111', expiry: '3012' } }]);
  });

  it('reports missing columns, empty files and too many rows', () => {
    expect(csvToBatchItems([['pan'], ['4111111111111111']], VISA_CVV2, 500).errors[0]).toContain('Missing column(s) for Visa CVV2: expiry');
    expect(csvToBatchItems([['pan', 'expiry']], VISA_CVV2, 500).errors[0]).toContain('at least one data row');
    const rows = [['pan', 'expiry'], ...Array(3).fill(['4111111111111111', '3012'])];
    expect(csvToBatchItems(rows, VISA_CVV2, 2).errors[0]).toContain('at most 2');
  });

  it('gives every result a status and writes them back as CSV', () => {
    expect([itemStatus({ index: 0, result: '597' }), itemStatus({ index: 1, result: '597', valid: true }),
            itemStatus({ index: 2, result: '597', valid: false }), itemStatus({ index: 3, error: 'PAN must be 13-19 digits' })])
      .toEqual(['GENERATED', 'MATCH', 'MISMATCH', 'ERROR']);

    const items = [{ ref: 'a', input: { pan: '4111111111111111', expiry: '3012' }, received: '598' }];
    const csv = resultsToCsv(VISA_CVV2, items, { operation: 'visa/cvv2', type: 'CVV2',
      summary: { total: 1, succeeded: 1, failed: 0 }, results: [{ index: 0, ref: 'a', result: '597', received: '598', valid: false }] });
    expect(csv).toEqual([['ref', 'pan', 'expiry', 'received', 'result', 'status', 'error'],
                         ['a', '4111111111111111', '3012', '598', '597', 'MISMATCH', '']]);
  });

  it('adds the cause, confidence, fix and explanation of every mismatch when the batch was explained', () => {
    const swapped = { cause: 'pan-transposition', title: 'PAN digits swapped', confidence: 'possible' as const,
                      explanation: 'Two PAN digits are swapped.',
                      changes: [{ field: 'pan', label: 'PAN', from: '4111111111111111', to: '1411111111111111' }] };
    const items = [{ ref: 'a', input: { pan: '4111111111111111', expiry: '3012' }, received: '598' },
                   { ref: 'b', input: { pan: '4111111111111111', expiry: '3012' }, received: '999' },
                   { ref: 'c', input: { pan: '4111111111111111', expiry: '3012' }, received: '597' }];
    const result = { operation: 'visa/cvv2', type: 'CVV2', summary: { total: 3, succeeded: 3, failed: 0 },
      results: [{ index: 0, ref: 'a', result: '597', received: '598', valid: false, diagnosis: { checked: 3, findings: [swapped] } },
                { index: 1, ref: 'b', result: '597', received: '999', valid: false, diagnosis: { checked: 20, findings: [] } },
                { index: 2, ref: 'c', result: '597', received: '597', valid: true }] };
    const csv = resultsToCsv(VISA_CVV2, items, result);
    expect(csv[0].slice(-4)).toEqual(['cause', 'confidence', 'fix', 'explanation']);
    expect(csv[1].slice(-4)).toEqual(['PAN digits swapped', 'possible', 'pan: 4111111111111111 -> 1411111111111111',
                                      'Two PAN digits are swapped.']);
    expect(csv[2].slice(-4)).toEqual(['No common cause found', '', '', '']);
    expect(csv[3].slice(-4)).toEqual(['', '', '', '']);
    expect(itemCause(result.results[1])?.cause).toBe('unexplained');
    expect(itemCause(result.results[2])).toBeNull();
    expect(fixText({ ...swapped, changes: [], operation: { id: 'visa/cvv', label: 'Visa CVV', type: 'CVV' } }))
      .toBe('it is the Visa CVV');
  });

  it('builds sample rows that show every outcome, including a mismatch with a known cause', () => {
    const cvv2 = { ...VISA_CVV2, example_result: '597' };
    expect(sampleRows(cvv2)).toEqual([
      ['ref', 'pan', 'expiry', 'received'],
      ['generate', '4111111111111111', '3012', ''],
      ['match', '4111111111111111', '3012', '597'],
      ['pan-typo', '1411111111111111', '3012', '597'],
      ['unknown-value', '4111111111111111', '3012', '999']]);
    const arpc = { ...VISA_CVV2, id: 'visa/arpc', example_result: 'C837D13061C1E896',
                   fields: [{ name: 'arqc', label: 'ARQC', example: '37858601E2285A5D' }, { name: 'tag_8a', label: '8A', example: '3030' }] };
    expect(sampleRows(arpc)[3]).toEqual(['response-code-raw', '37858601E2285A5D', '0000', 'C837D13061C1E896']);
    const arqc = { ...VISA_CVV2, id: 'discover/arqc', example_result: '37858601E2285A5D',
                   fields: [{ name: 'tag_9f36', label: 'ATC', example: '0001' }] };
    expect(sampleRows(arqc)[3]).toEqual(['counter-moved-on', '0002', '37858601E2285A5D']);
    expect(sampleRows(arqc)[4][2]).toBe('0123456789ABCDEF');
  });
});
