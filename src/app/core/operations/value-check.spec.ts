import {
  changesOf, checkReport, compareChars, fieldTitle, findingOf, isApplied, normaliseReceived, resultFormat
} from './value-check';
import { DiagnosisFinding } from './operations.models';

const ATC: DiagnosisFinding = {
  cause: 'atc-drift', confidence: 'certain',
  explanation: 'The received cryptogram belongs to a later transaction.',
  changes: [{ field: 'tag_9f36', label: 'Tag 9F36 (Application Transaction Counter)', from: '0001', to: '0002' }]
};

describe('value-check helpers', () => {
  it('derives the received format from the calculated value', () => {
    expect(resultFormat('597').description).toBe('3 digits');
    expect(resultFormat('597').pattern.test('123')).toBe(true);
    expect(resultFormat('597').pattern.test('1234')).toBe(false);
    expect(resultFormat('949BBD6013450C7D').description).toBe('16 hex characters');
    expect(resultFormat('949BBD6013450C7D').pattern.test('949bbd6013450c7d')).toBe(true);
  });

  it('normalises a received value like the API does', () => {
    expect(normaliseReceived('  949bbd6013450c7d ')).toBe('949BBD6013450C7D');
  });

  it('marks differing characters', () => {
    expect(compareChars('ABCD', 'ABXD').map(c => c.same)).toEqual([true, true, false, true]);
  });

  it('turns a finding into an input patch and knows when it was applied', () => {
    expect(changesOf(ATC)).toEqual({ tag_9f36: '0002' });
    expect(isApplied(ATC, { tag_9f36: '0002' })).toBe(true);
    expect(isApplied(ATC, { tag_9f36: '0001' })).toBe(false);
    expect(isApplied({ ...ATC, changes: [] }, {})).toBe(false);
    expect(findingOf({ status: 'done', diagnosis: { checked: 1, findings: [ATC] } })).toBe(ATC);
    expect(findingOf({ status: 'loading' })).toBeNull();
  });

  it('names fields readably', () => {
    expect(fieldTitle('tag_9f02')).toBe('Tag 9F02');
    expect(fieldTitle('service_code')).toBe('Service code');
    expect(fieldTitle('other')).toBe('other');
  });

  it('writes a check report with everything needed to reproduce it, and the cause', () => {
    const report = checkReport({ value: 'Visa ARQC (visa/arqc)', input: { tag_9f36: '0001' },
                                 expected: '949BBD6013450C7D', received: '673A05ED91892AF8',
                                 explanation: { status: 'done', diagnosis: { checked: 1, findings: [ATC] } } });
    expect(report).toContain('Outcome:   NO MATCH');
    expect(report).toContain('Tag 9F36        0001');
    expect(report).toContain('Likely cause (certain): The received cryptogram belongs to a later transaction.');
    expect(report).toContain('Change Tag 9F36: 0001 -> 0002');
    expect(report).toContain('Test data and test keys only.');
  });

  it('says so in the report when no common cause explains the mismatch', () => {
    const report = checkReport({ value: 'x', input: {}, expected: 'A', received: 'B',
                                 explanation: { status: 'done', diagnosis: { checked: 13, findings: [] } } });
    expect(report).toContain('none of 13 common input mistakes');
    expect(checkReport({ value: 'x', input: {}, expected: 'A', received: 'A' })).toContain('Outcome:   MATCH');
  });
});
