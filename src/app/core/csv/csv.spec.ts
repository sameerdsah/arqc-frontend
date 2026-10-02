import { parseCsv, toCsv } from './csv';

describe('csv', () => {
  it('parses simple rows with CRLF or LF line ends and skips empty lines', () => {
    expect(parseCsv('a,b\r\n1,2\n\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
  });

  it('handles quotes, escaped quotes, commas and line breaks inside quotes', () => {
    expect(parseCsv('ref,note\n"r,1","say ""hi""\nthere"')).toEqual([['ref', 'note'], ['r,1', 'say "hi"\nthere']]);
  });

  it('ignores the byte-order mark Excel adds', () => {
    expect(parseCsv('﻿pan,expiry\n4111111111111111,3012')[0]).toEqual(['pan', 'expiry']);
  });

  it('keeps empty cells', () => {
    expect(parseCsv('a,b,c\n1,,3')).toEqual([['a', 'b', 'c'], ['1', '', '3']]);
  });

  it('writes CSV with quoting and protection against spreadsheet formulas', () => {
    expect(toCsv([['a', 'b,c', 'say "hi"'], ['=1+1', '-5', '597']]))
      .toBe('a,"b,c","say ""hi"""\r\n\'=1+1,\'-5,597\r\n');
  });

  it('round-trips its own output', () => {
    const rows = [['ref', 'pan'], ['row "1"', '4111111111111111']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
