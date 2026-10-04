/**
 * Learn: short guides for testers and developers who are new to EMV values.
 * Content only (no Angular), so the site map and the tests can use it directly.
 * Each guide ends with "Try it" links into the app, so reading leads straight to doing.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  points?: string[];
}

export interface TagRow {
  tag: string;
  name: string;
  holds: string;
  usedBy: string;
}

export interface GuideLink {
  label: string;
  url: string;
}

export interface Guide {
  slug: string;
  title: string;
  kind: 'Guide' | 'Reference';
  minutes: number;
  summary: string;
  sections: GuideSection[];
  tags?: TagRow[];
  tryIt: GuideLink[];
}

export const LEARN_URL = '/learn';

export const GUIDES: Guide[] = [
  {
    slug: 'what-is-a-cryptogram',
    title: 'What is a cryptogram?',
    kind: 'Guide',
    minutes: 3,
    summary: 'The one-time seal a chip puts on each payment, and why a copied value cannot be reused.',
    sections: [
      {
        heading: 'A seal on one payment',
        paragraphs: [
          'When a chip card pays, the chip does not just send the card number. It also calculates a short code, ' +
          'the Application Cryptogram, over the details of this payment: the amount, the currency, the date, a ' +
          'random number from the terminal and the card\'s own transaction counter.',
          'The code is calculated with a secret key that is stored inside the chip and cannot be read out. ' +
          'The card issuer holds the same key, so it can recalculate the code and compare.'
        ]
      },
      {
        heading: 'Why it stops fraud',
        paragraphs: [
          'Change one detail of the payment, or replay an old one, and the issuer\'s calculation no longer matches. ' +
          'Because the terminal\'s random number (9F37) and the counter (9F36) change every time, a cryptogram is ' +
          'only ever valid once.'
        ],
        points: [
          'Copying a card number is not enough to pay with a chip.',
          'A cryptogram cannot be reused for a second payment.',
          'Changing the amount after the card signed it is detected.'
        ]
      },
      {
        heading: 'The values in this app',
        paragraphs: [
          'ARQC is the cryptogram the card sends with an online authorisation request. ARPC is the issuer\'s answer, ' +
          'which the card checks. The CVV / CVC family are the shorter verification codes on the stripe, the back of ' +
          'the card, in the chip and in contactless payments.',
          'This app calculates all of them with test keys, so test teams can create correct values and find out why a ' +
          'value they received does not match.'
        ]
      }
    ],
    tryIt: [
      { label: 'Calculate a Visa ARQC', url: '/visa/arqc' },
      { label: 'Read the round trip guide', url: '/learn/arqc-arpc-round-trip' }
    ]
  },
  {
    slug: 'arqc-arpc-round-trip',
    title: 'ARQC and ARPC: the round trip',
    kind: 'Guide',
    minutes: 5,
    summary: 'Card to issuer and back: who calculates what, and what each side proves.',
    sections: [
      {
        heading: '1. The card asks: ARQC',
        paragraphs: [
          'The terminal sends the payment details to the chip (Generate AC). The chip increases its transaction ' +
          'counter, calculates the ARQC (tag 9F26) with its key and returns it with the counter (9F36) and ' +
          'the Issuer Application Data (9F10).',
          'The terminal puts all of this in field 55 of the authorisation request and sends it through the acquirer ' +
          'and the card network to the issuer.'
        ]
      },
      {
        heading: '2. The issuer checks: is the card genuine?',
        paragraphs: [
          'The issuer derives the card\'s key from its own master key and the card number (and, for most cryptogram ' +
          'versions, a session key from the counter), recalculates the ARQC over the same data and compares. A match proves the payment came from the real ' +
          'chip and the data was not changed on the way.'
        ]
      },
      {
        heading: '3. The issuer answers: ARPC',
        paragraphs: [
          'The issuer then calculates the ARPC from the ARQC and its response code (8A, for example "00" approved). ' +
          'It travels back in tag 91, Issuer Authentication Data.'
        ]
      },
      {
        heading: '4. The card checks: is the answer genuine?',
        paragraphs: [
          'The terminal passes tag 91 to the chip, which recalculates the ARPC. A match proves the answer came from ' +
          'the real issuer, so the card can trust the decision and, for example, reset its offline counters.'
        ],
        points: [
          'ARQC: the card proves itself to the issuer.',
          'ARPC: the issuer proves itself to the card.',
          'Both use keys only the card and the issuer hold.'
        ]
      }
    ],
    tryIt: [
      { label: 'Calculate a Mastercard ARQC', url: '/mastercard/arqc' },
      { label: 'Calculate the matching ARPC', url: '/mastercard/arpc' }
    ]
  },
  {
    slug: 'how-a-transaction-ends',
    title: 'How a transaction ends: ARQC, TC and AAC',
    kind: 'Guide',
    minutes: 4,
    summary: 'The three cryptograms a chip can return, and the six ways a chip payment ends.',
    sections: [
      {
        heading: 'Three answers to one question',
        paragraphs: [
          'When the terminal asks the chip for a cryptogram (GENERATE AC), the chip answers with one of three. The '
          + 'calculation is the same; the Cryptogram Information Data (tag 9F27) says which one it is, and the chip '
          + 'records its decision in its status bits (the CVR, inside 9F10).'
        ],
        points: [
          'ARQC (9F27 = 80): go online - the issuer decides.',
          'TC (9F27 = 40): Transaction Certificate - approved; kept as proof for clearing and disputes.',
          'AAC (9F27 = 00): Application Authentication Cryptogram - declined.'
        ]
      },
      {
        heading: 'The six endings',
        paragraphs: ['Every chip payment ends in one of these, and each is a test case of its own:'],
        points: [
          'Online approved: ARQC -> issuer approves (ARPC, 8A 3030) -> the card finishes with a TC.',
          'Online declined: ARQC -> issuer declines (for example 8A 3035) -> the card finishes with an AAC.',
          'Offline approved: a low-risk payment within the card\'s limits -> TC straight away.',
          'Offline declined: the card or terminal refuses -> AAC straight away.',
          'Unable to go online: the host cannot be reached -> the card decides, TC or AAC, by its rules.',
          'Issuer authentication failed: the ARPC does not match -> the card records it and usually declines.'
        ]
      },
      {
        heading: 'In this tool',
        paragraphs: [
          'Discover, Visa and Mastercard each have ARQC, TC and AAC pages, and each answers with the value and its '
          + '9F27. Pasted chip data that holds another cryptogram points you to its page. Use the 9F10 and 9F36 the card '
          + 'sent with that cryptogram: the status bits in 9F10 differ between an ARQC and a TC.',
          'The second cryptogram after an online authorisation (the TC or AAC that follows the ARPC) can include the '
          + 'issuer\'s response code in its data on some schemes; that variant is planned with the round-trip screen.'
        ]
      }
    ],
    tryIt: [
      { label: 'Calculate a Visa TC', url: '/visa/tc' },
      { label: 'Calculate the ARPC (issuer answer)', url: '/visa/arpc' }
    ]
  },
  {
    slug: 'why-values-do-not-match',
    title: 'Why values do not match',
    kind: 'Guide',
    minutes: 4,
    summary: 'The usual mistakes in test data, and how the Mismatch Explainer finds them.',
    sections: [
      {
        heading: 'One wrong byte changes everything',
        paragraphs: [
          'A cryptogram is designed so that any change to its input gives a completely different result. ' +
          'That is good for security, but it means a mismatch on its own says nothing about what went wrong.'
        ]
      },
      {
        heading: 'The usual causes',
        paragraphs: ['In test data, most mismatches come from a short list of mistakes:'],
        points: [
          'The value belongs to a different transaction: the counter (9F36) moved on.',
          'Country code (9F1A) and currency code (5F2A) swapped, or the amounts 9F02 and 9F03 swapped.',
          'The amount sent in major units (10.00 as 000000000010 instead of 000000001000).',
          'A different currency, transaction type or date than the one the card used.',
          'The unpredictable number (9F37) with its bytes reversed.',
          'The response code (8A) sent as "00" instead of its ASCII form 3030, or a different code.',
          'The received value is another value of the same card, for example the CID instead of the CVV.'
        ]
      },
      {
        heading: 'How the Mismatch Explainer works',
        paragraphs: [
          'When a received value does not match, the app recalculates it with each of these mistakes applied, ' +
          'most common first, and stops at the first one that reproduces the received value exactly. ' +
          'It then shows the cause in plain English and offers to apply the fix, and the Match that follows proves it.',
          'For short values such as a 3-digit CVV, a random match is possible, so the cause is shown as "possible" ' +
          'rather than "certain".'
        ]
      }
    ],
    tryIt: [
      { label: 'See it explain a Visa ARQC', url: '/visa/arqc?tag_9f02=000000010000&tag_9f03=000000000000&tag_9f1a=0826&tag_95=0000000000&tag_5f2a=0826&tag_9a=261001&tag_9c=00&tag_9f37=12345678&tag_82=3C00&tag_9f36=0001&tag_9f10=06010A03A00000&received=673A05ED91892AF8' },
      { label: 'Check any value', url: '/tools/verify' }
    ]
  },
  {
    slug: 'card-verification-codes',
    title: 'CVV, CVC and CID: one idea, four places',
    kind: 'Guide',
    minutes: 3,
    summary: 'Why a card has several 3- and 4-digit codes, and which one each check expects.',
    sections: [
      {
        heading: 'Same calculation, different service code',
        paragraphs: [
          'For Discover, Mastercard and Visa the verification codes are calculated from the card number, the expiry ' +
          'date and a service code with the issuer\'s card verification keys (American Express uses its own CSC method). Changing the service code gives a different code for each place the card ' +
          'can be read, so a code copied from one place does not work in another.'
        ],
        points: [
          'Magnetic stripe: CVV / CVC1 / CSC, with the card\'s real service code (for example 201).',
          'Printed on the card: CVV2 / CVC2 / CID, with service code 000.',
          'In the chip\'s track 2 data: iCVV / Chip CVC, with service code 999.',
          'Contactless: dCVV / CVC3 / dynamic CSC, which change with every transaction.'
        ]
      },
      {
        heading: 'A common mix-up',
        paragraphs: [
          'Testers often check the printed code where the stripe code is expected, or the other way round. ' +
          'The Mismatch Explainer recognises this: it tells you which value of the card you actually have and opens ' +
          'the right page.'
        ]
      }
    ],
    tryIt: [
      { label: 'Calculate a Visa CVV2', url: '/visa/cvv2' },
      { label: 'Calculate a Mastercard CVC1', url: '/mastercard/cvc1' }
    ]
  },
  {
    slug: 'emv-tags',
    title: 'EMV tag dictionary',
    kind: 'Reference',
    minutes: 2,
    summary: '9F02, 9F36, 9F10 and the rest: what each tag holds and which values use it.',
    sections: [
      {
        heading: 'Reading the tags',
        paragraphs: [
          'Chip data is a list of tags, each with a length and a value in hex (TLV). Paste field 55 from a log on any ' +
          'ARQC, TC, AAC or ARPC page and the app fills the form from these tags.'
        ]
      }
    ],
    tags: [
      { tag: '9F02', name: 'Amount, Authorised', holds: '12 digits, minor units: 000000001000 = 10.00', usedBy: 'ARQC' },
      { tag: '9F03', name: 'Amount, Other', holds: '12 digits, cashback amount', usedBy: 'ARQC' },
      { tag: '9F1A', name: 'Terminal Country Code', holds: 'ISO 3166 numeric, e.g. 0826 United Kingdom', usedBy: 'ARQC' },
      { tag: '95', name: 'Terminal Verification Results', holds: '5 bytes of terminal check results', usedBy: 'ARQC' },
      { tag: '5F2A', name: 'Transaction Currency Code', holds: 'ISO 4217 numeric, e.g. 0978 euro', usedBy: 'ARQC' },
      { tag: '9A', name: 'Transaction Date', holds: 'YYMMDD', usedBy: 'ARQC' },
      { tag: '9C', name: 'Transaction Type', holds: '00 purchase, 01 cash, 20 refund', usedBy: 'ARQC' },
      { tag: '9F37', name: 'Unpredictable Number', holds: '4 random bytes from the terminal', usedBy: 'ARQC' },
      { tag: '82', name: 'Application Interchange Profile', holds: '2 bytes: what the card supports', usedBy: 'ARQC' },
      { tag: '9F36', name: 'Application Transaction Counter', holds: '2 bytes, +1 on every transaction', usedBy: 'ARQC, dCVV' },
      { tag: '9F10', name: 'Issuer Application Data', holds: 'Includes the cryptogram version (CVN)', usedBy: 'ARQC' },
      { tag: '9F26', name: 'Application Cryptogram', holds: 'The ARQC, 8 bytes', usedBy: 'Received value' },
      { tag: '8A', name: 'Authorisation Response Code', holds: '2 ASCII characters: 3030 = "00"', usedBy: 'ARPC' },
      { tag: '91', name: 'Issuer Authentication Data', holds: 'The ARPC (8 bytes) and response code', usedBy: 'Received value' },
      { tag: '5A', name: 'Application PAN', holds: 'The card number', usedBy: 'Key derivation, CVV' },
      { tag: '57', name: 'Track 2 Equivalent Data', holds: 'PAN, expiry and service code', usedBy: 'CVV family' },
      { tag: '4F / 84', name: 'Application Identifier (AID)', holds: 'Which network\'s application: A000000003 = Visa', usedBy: 'Network' }
    ],
    tryIt: [
      { label: 'Paste chip data on the Visa ARQC page', url: '/visa/arqc' }
    ]
  }
];

export function findGuide(slug: string | undefined | null): Guide | null {
  return GUIDES.find(g => g.slug === slug) ?? null;
}
