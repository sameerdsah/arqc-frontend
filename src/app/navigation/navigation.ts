import { findTestingTool, TESTING_TOOLS } from '../tools/testing-tools';
import { findGuide, GUIDES, LEARN_URL } from '../learn/learn-guides';

/**
 * The site map: networks, their values and the testing tools, and everything derived from it -
 * reading an address, the header links, the breadcrumb, the value switcher and the page title.
 * One source of truth: a new network or value appears everywhere by adding it here.
 * Pure functions only (no Angular), so the navigation is tested without a browser.
 */

export type Network = 'discover' | 'mastercard' | 'visa' | 'amex' | null;
export type Tool = string | null;

// One entry per button on a network page. `slug` is the address (e.g. /mastercard/cvc2),
// `label` is the button text and `name` is the full name shown as the page subtitle.
export interface ToolOption {
  slug: string;
  label: string;
  name: string;
}

export interface NetworkConfig {
  label: string;
  shortLabel: string;   // header link, e.g. 'Amex'
  platform: string;
  tools: ToolOption[];
}

// Each network lists the same kinds of value, in the same order, using that
// network's own names: chip cryptogram, issuer response, (v2) the card's final
// cryptograms TC and AAC, stripe value, printed value, chip value (service code 999)
// and contactless dynamic value. American Express gets TC and AAC with its ARQC.
export const NETWORK_CONFIG: Record<Exclude<Network, null>, NetworkConfig> = {
  discover: {
    label: 'Discover',
    shortLabel: 'Discover',
    platform: 'D-PAS',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'tc', label: 'TC', name: 'Transaction Certificate: the card approved (9F27 = 40)' },
      { slug: 'aac', label: 'AAC', name: 'Application Authentication Cryptogram: the card declined (9F27 = 00)' },
      { slug: 'cvv', label: 'CVV', name: 'Card Verification Value (magnetic stripe)' },
      { slug: 'cid', label: 'CID', name: 'Card Identification Number (printed on the card)' },
      { slug: 'icvv', label: 'iCVV', name: 'Integrated Card Verification Value (stored in the chip)' },
      { slug: 'dcvv', label: 'DCVV', name: 'Dynamic Card Verification Value (contactless)' }
    ]
  },
  mastercard: {
    label: 'Mastercard',
    shortLabel: 'Mastercard',
    platform: 'M/Chip',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'tc', label: 'TC', name: 'Transaction Certificate: the card approved (9F27 = 40)' },
      { slug: 'aac', label: 'AAC', name: 'Application Authentication Cryptogram: the card declined (9F27 = 00)' },
      { slug: 'cvc1', label: 'CVC1', name: 'Card Validation Code 1 (magnetic stripe)' },
      { slug: 'cvc2', label: 'CVC2', name: 'Card Validation Code 2 (printed on the card)' },
      { slug: 'chip-cvc', label: 'Chip CVC', name: 'Chip Card Validation Code (stored in the chip)' },
      { slug: 'cvc3', label: 'CVC3', name: 'Dynamic Card Validation Code (contactless)' }
    ]
  },
  visa: {
    label: 'Visa',
    shortLabel: 'Visa',
    platform: 'VSDC / qVSDC',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'tc', label: 'TC', name: 'Transaction Certificate: the card approved (9F27 = 40)' },
      { slug: 'aac', label: 'AAC', name: 'Application Authentication Cryptogram: the card declined (9F27 = 00)' },
      { slug: 'cvv', label: 'CVV', name: 'Card Verification Value (magnetic stripe)' },
      { slug: 'cvv2', label: 'CVV2', name: 'Card Verification Value 2 (printed on the card)' },
      { slug: 'icvv', label: 'iCVV', name: 'Integrated Card Verification Value (stored in the chip)' },
      { slug: 'dcvv', label: 'dCVV', name: 'Dynamic Card Verification Value (contactless)' }
    ]
  },
  amex: {
    label: 'American Express',
    shortLabel: 'Amex',
    platform: 'AEIPS / Expresspay',
    tools: [
      { slug: 'arqc', label: 'ARQC', name: 'Authorization Request Cryptogram (9F26)' },
      { slug: 'arpc', label: 'ARPC', name: 'Authorization Response Cryptogram' },
      { slug: 'csc', label: 'CSC', name: 'Card Security Code (magnetic stripe)' },
      { slug: 'cid', label: 'CID', name: 'Card Identification Number (4 digits, printed on the front)' },
      { slug: 'chip-csc', label: 'Chip CSC', name: 'Chip Card Security Code (stored in the chip)' },
      { slug: 'dynamic-csc', label: 'Dynamic CSC', name: 'Expresspay dynamic value (contactless)' }
    ]
  }
};

export const NETWORKS: Exclude<Network, null>[] = ['discover', 'mastercard', 'visa', 'amex'];

export interface ParsedUrl {
  network: Network;
  tool: Tool;
  testingTool: string | null;   // /tools/verify, /tools/batch
  learn: boolean;               // /learn and /learn/<guide>
  guide: string | null;         // /learn/what-is-a-cryptogram
  valid: boolean;
}

const NOWHERE = { network: null, tool: null, testingTool: null, learn: false, guide: null };

// Turns an address like /discover/cvv or /tools/verify into { network, tool, testingTool, valid }
export function parseUrl(url: string): ParsedUrl {
  const path = url.split(/[?#]/)[0];
  const segments = path.split('/').filter(Boolean).map(s => s.toLowerCase());
  const [networkPart, toolPart] = segments;

  if (networkPart === 'tools') {
    const testingTool = segments.length === 2 ? findTestingTool(toolPart) : null;
    return { ...NOWHERE, testingTool: testingTool?.slug ?? null, valid: !!testingTool };
  }

  if (networkPart === 'learn') {
    const guide = toolPart ? findGuide(toolPart) : null;
    const valid = segments.length === 1 || (segments.length === 2 && !!guide);
    return valid ? { ...NOWHERE, learn: true, guide: guide?.slug ?? null, valid } : { ...NOWHERE, valid };
  }

  const network = NETWORKS.includes(networkPart as Exclude<Network, null>) ? (networkPart as Network) : null;
  const tool = network && NETWORK_CONFIG[network].tools.some(t => t.slug === toolPart) ? toolPart : null;
  const valid = segments.length <= 2 && (!networkPart || !!network) && (!toolPart || !!tool);

  return valid ? { ...NOWHERE, network, tool, valid } : { ...NOWHERE, valid };
}


/** A link in the header, breadcrumb or value switcher. */
export interface NavLink {
  label: string;
  url: string;
  active: boolean;
  title?: string;      // tooltip: the full name
}

const TOOLS_URL = '/tools';

/** Header: the four networks, the testing tools and Learn; the section of the current page is active. */
export function headerLinks(route: ParsedUrl): { networks: NavLink[]; tools: NavLink[]; learn: NavLink } {
  return {
    learn: { label: 'Learn', url: LEARN_URL, active: route.learn, title: 'Short guides: cryptograms, ARQC / ARPC, EMV tags' },
    networks: NETWORKS.map(n => ({
      label: NETWORK_CONFIG[n].shortLabel, url: `/${n}`, active: route.network === n,
      title: `${NETWORK_CONFIG[n].label} (${NETWORK_CONFIG[n].platform})`
    })),
    tools: TESTING_TOOLS.map(t => ({
      label: t.shortLabel, url: `${TOOLS_URL}/${t.slug}`, active: route.testingTool === t.slug, title: t.description
    }))
  };
}

/** Home > Visa > ARQC, or Home > Verify a Value. Empty on the start page. */
export function breadcrumb(route: ParsedUrl): NavLink[] {
  const home: NavLink = { label: 'Home', url: '/', active: false };
  if (route.learn) {
    const guide = findGuide(route.guide);
    const learn: NavLink = { label: 'Learn', url: LEARN_URL, active: !guide };
    return guide ? [home, learn, { label: guide.title, url: `${LEARN_URL}/${guide.slug}`, active: true }] : [home, learn];
  }
  if (route.testingTool) {
    const tool = findTestingTool(route.testingTool)!;
    return [home, { label: tool.label, url: `${TOOLS_URL}/${tool.slug}`, active: true, title: tool.description }];
  }
  if (!route.network) {
    return [];
  }
  const config = NETWORK_CONFIG[route.network];
  const network: NavLink = { label: config.label, url: `/${route.network}`, active: !route.tool };
  const tool = config.tools.find(t => t.slug === route.tool);
  return tool ? [home, network, { label: tool.label, url: `/${route.network}/${tool.slug}`, active: true, title: tool.name }]
              : [home, network];
}

/** The other values of the same network (or the other testing tools): one click to switch. */
export function valueSwitcher(route: ParsedUrl): NavLink[] {
  if (route.learn) {
    return route.guide ? GUIDES.map(g => ({ label: g.title, url: `${LEARN_URL}/${g.slug}`, active: g.slug === route.guide,
                                            title: g.summary })) : [];
  }
  if (route.testingTool) {
    return TESTING_TOOLS.map(t => ({ label: t.label, url: `${TOOLS_URL}/${t.slug}`, active: t.slug === route.testingTool,
                                     title: t.description }));
  }
  if (!route.network || !route.tool) {
    return [];
  }
  return NETWORK_CONFIG[route.network].tools.map(t => ({
    label: t.label, url: `/${route.network}/${t.slug}`, active: t.slug === route.tool, title: t.name
  }));
}

/** Browser tab title, e.g. "Visa ARQC · Cryptogram Generator": tabs and history stay recognisable. */
export function pageTitle(route: ParsedUrl): string {
  const app = 'Cryptogram Generator';
  if (route.learn) {
    return `${findGuide(route.guide)?.title ?? 'Learn'} · ${app}`;
  }
  if (route.testingTool) {
    return `${findTestingTool(route.testingTool)!.label} · ${app}`;
  }
  if (!route.network) {
    return app;
  }
  const config = NETWORK_CONFIG[route.network];
  const tool = config.tools.find(t => t.slug === route.tool);
  return `${tool ? `${config.label} ${tool.label}` : config.label} · ${app}`;
}
