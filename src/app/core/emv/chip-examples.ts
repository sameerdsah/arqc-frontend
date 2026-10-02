import { OperationInfo } from '../operations/operations.models';
import { buildTlv, chipEncode, tagForField } from './tlv';

/** Example field 55 for a form: the form's example values as chip tags, plus tags the form does not need. */
export function exampleChipDataFor(fields: { name: string; example: string }[], extra: [string, string][] = []): string {
  const pairs: [string, string][] = [];
  for (const f of fields) {
    const tag = tagForField(f.name);
    if (tag) {
      pairs.push([tag, chipEncode(f.name, f.example)]);
    }
  }
  return buildTlv([...pairs, ...extra]);
}

/**
 * Example chip data for an operation of the catalogue, ready to verify:
 * ARQC operations carry the matching ARQC in 9F26, ARPC operations the matching ARPC in 91.
 */
export function exampleChipData(op: OperationInfo): string {
  const extra: [string, string][] = [];
  if (op.type === 'ARQC' && op.example_result) {
    extra.push(['9F26', op.example_result], ['9F27', '80']);
  } else if (op.type === 'ARPC' && op.example_result) {
    const arc = op.fields.find(f => f.name === 'tag_8a')?.example ?? '3030';
    extra.push(['91', op.example_result + arc]);
  }
  return exampleChipDataFor(op.fields, extra);
}
