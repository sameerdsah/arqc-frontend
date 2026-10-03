import { EmvField } from '../shared/emv-arqc-form/emv-arqc-form';

/** Discover test card: gives CVV 561, CID 636 and iCVV 651 (service code 101 for the CVV). */
export const DISCOVER_TEST_CARD = { pan: '4123456789012345', expiry: '8701' };

/**
 * The five EMV tags of the Discover ARQC (POST /api/arqc). The examples give ARQC 37858601E2285A5D.
 * No headings: five fields read fine as one group.
 */
export const DISCOVER_ARQC_FIELDS: EmvField[] = [
  { key: 'tag_9f02', id: 'tag9F02', label: 'Tag 9F02 (Amount, Authorized)', pattern: '^[0-9]{12}$', message: 'Please enter a valid amount', example: '000000010000' },
  { key: 'tag_5f2a', id: 'tag5F2A', label: 'Tag 5F2A (Currency Code)', pattern: '^[0-9]{4}$', message: 'Please enter a valid currency code', example: '0978' },
  { key: 'tag_9f37', id: 'tag9F37', label: 'Tag 9F37 (Unpredictable Number)', pattern: '^[0-9A-Fa-f]{8}$', message: 'Please enter a valid unpredictable number', example: '12345678' },
  { key: 'tag_9f36', id: 'tag9F36', label: 'Tag 9F36 (Application Transaction Counter)', pattern: '^[0-9A-Fa-f]{4}$', message: 'Please enter a valid transaction counter', example: '0001' },
  { key: 'tag_9f10', id: 'tag9F10', label: 'Tag 9F10 (Issuer Application Data)', pattern: '^(?:[0-9A-Fa-f]{2}){10,32}$', message: 'Please enter valid issuer application data', example: '06150102030405060708' }
];
