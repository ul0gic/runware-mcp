import { RunwareApiError } from './errors.js';

/* eslint-disable sonarjs/no-hardcoded-ip -- the blocklist is inherently a table of literal IP ranges */
const NON_GLOBAL_IPV4_CIDRS = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.88.99.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4',
  '240.0.0.0/4',
] as const;
/* eslint-enable sonarjs/no-hardcoded-ip */

// eslint-disable-next-line sonarjs/no-hardcoded-ip -- intentional blocklist entry
const AWS_METADATA_IP = '169.254.169.254';

// eslint-disable-next-line sonarjs/no-hardcoded-ip -- intentional blocklist entry
const ALIBABA_METADATA_IP = '100.100.100.200';

const METADATA_HOSTNAMES = new Set([
  AWS_METADATA_IP,
  ALIBABA_METADATA_IP,
  'metadata.google.internal',
  'metadata.goog',
  'metadata.azure.com',
  'kubernetes.default.svc',
  'kubernetes.default',
]);

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^localhost\./i,
  /\.localhost$/i,
  /^internal$/i,
  /\.internal$/i,
  /^local$/i,
  /\.local$/i,
] as const;

/** Rejects leading zeros: resolvers may read `0177.0.0.1` as octal while a naive decimal parse sees 177. */
function parseIpv4(text: string): number | null {
  const parts = text.split('.');

  if (parts.length !== 4) {
    return null;
  }

  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || (part.length > 1 && part.startsWith('0'))) {
      return null;
    }

    const octet = Number(part);
    if (octet > 255) {
      return null;
    }

    result = result * 256 + octet;
  }

  return result;
}

function cidrToRange(cidr: string): { readonly start: number; readonly end: number } {
  const [base = '', prefix = ''] = cidr.split('/');
  const start = parseIpv4(base);

  if (start === null) {
    throw new Error(`Malformed CIDR in non-global table: ${cidr}`);
  }

  return { start, end: start + 2 ** (32 - Number(prefix)) - 1 };
}

const NON_GLOBAL_IPV4_RANGES = NON_GLOBAL_IPV4_CIDRS.map((cidr) => cidrToRange(cidr));

function isGlobalIpv4(address: number): boolean {
  return !NON_GLOBAL_IPV4_RANGES.some(
    (range) => address >= range.start && address <= range.end,
  );
}

function expandGroups(groups: readonly string[]): number[] | null {
  const words: number[] = [];

  for (const [index, group] of groups.entries()) {
    if (group.includes('.')) {
      if (index !== groups.length - 1) {
        return null;
      }

      const embedded = parseIpv4(group);
      if (embedded === null) {
        return null;
      }

      words.push(Math.floor(embedded / 0x1_00_00), embedded % 0x1_00_00);
      continue;
    }

    if (!/^[\da-f]{1,4}$/i.test(group)) {
      return null;
    }

    words.push(Number.parseInt(group, 16));
  }

  return words;
}

function parseIpv6(text: string): Uint8Array | null {
  let body = text;

  if (body.startsWith('[') && body.endsWith(']')) {
    body = body.slice(1, -1);
  }

  const zoneIndex = body.indexOf('%');
  if (zoneIndex !== -1) {
    body = body.slice(0, zoneIndex);
  }

  if (body.length === 0) {
    return null;
  }

  const compressionIndex = body.indexOf('::');
  const compressed = compressionIndex !== -1;

  if (compressed && body.includes('::', compressionIndex + 1)) {
    return null;
  }

  const headText = compressed ? body.slice(0, compressionIndex) : body;
  const tailText = compressed ? body.slice(compressionIndex + 2) : '';

  const head = expandGroups(headText.length > 0 ? headText.split(':') : []);
  const tail = expandGroups(tailText.length > 0 ? tailText.split(':') : []);

  if (head === null || tail === null) {
    return null;
  }

  const supplied = head.length + tail.length;

  if (compressed ? supplied > 7 : supplied !== 8) {
    return null;
  }

  const words = [...head, ...Array.from<number>({ length: 8 - supplied }).fill(0), ...tail];

  return Uint8Array.from(words.flatMap((word) => [word >>> 8, word & 0xFF]));
}

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((value, index) => bytes.at(index) === value);
}

function embeddedIpv4(bytes: Uint8Array, offset: number): number {
  return [...bytes.subarray(offset, offset + 4)].reduce(
    (address, byte) => address * 256 + byte,
    0,
  );
}

function isGlobalIpv6(bytes: Uint8Array): boolean {
  const first = bytes[0] ?? 0;
  const second = bytes[1] ?? 0;

  if (first === 0xFF) {
    return false;
  }

  if (first === 0xFE && (second & 0xC0) === 0x80) {
    return false;
  }

  if ((first & 0xFE) === 0xFC) {
    return false;
  }

  if (hasPrefix(bytes, [0x20, 0x01, 0x0D, 0xB8]) || hasPrefix(bytes, [0x20, 0x01, 0x00, 0x00])) {
    return false;
  }

  if (hasPrefix(bytes, [0x01, 0x00, 0, 0, 0, 0, 0, 0])) {
    return false;
  }

  if (hasPrefix(bytes, [0x20, 0x02])) {
    return isGlobalIpv4(embeddedIpv4(bytes, 2));
  }

  if (hasPrefix(bytes, [0, 0x64, 0xFF, 0x9B, 0, 0, 0, 0, 0, 0, 0, 0])) {
    return isGlobalIpv4(embeddedIpv4(bytes, 12));
  }

  const first10Zero = bytes.slice(0, 10).every((byte) => byte === 0);

  if (first10Zero && bytes[10] === 0xFF && bytes[11] === 0xFF) {
    return isGlobalIpv4(embeddedIpv4(bytes, 12));
  }

  if (first10Zero && bytes[10] === 0 && bytes[11] === 0) {
    return false;
  }

  return true;
}

/** A bracketed literal is unambiguously an IP, so an unparseable one is rejected rather than treated as a DNS name. */
function isNonGlobalIpLiteral(hostname: string): boolean {
  if (hostname.startsWith('[')) {
    const bytes = parseIpv6(hostname);
    return bytes === null || !isGlobalIpv6(bytes);
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4 !== null) {
    return !isGlobalIpv4(ipv4);
  }

  const bytes = parseIpv6(hostname);
  if (bytes !== null) {
    return !isGlobalIpv6(bytes);
  }

  return false;
}

/** Returns false for DNS names — they are not IP literals, so no address classification applies. */
export function isPrivateIP(ip: string): boolean {
  return isNonGlobalIpLiteral(ip);
}

export function isMetadataEndpoint(hostname: string): boolean {
  return METADATA_HOSTNAMES.has(hostname.toLowerCase());
}

function rejectUrl(urlString: string): string | null {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    return 'Invalid URL format';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Only http and https URLs are allowed';
  }

  if (url.username !== '' || url.password !== '') {
    return 'URLs with embedded credentials are not allowed';
  }

  const hostname = url.hostname.toLowerCase();

  if (isMetadataEndpoint(hostname)) {
    return 'Access to cloud metadata endpoints is not allowed';
  }

  if (BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return 'Access to local/internal hosts is not allowed';
  }

  if (isNonGlobalIpLiteral(hostname)) {
    return 'Access to non-global IP addresses is not allowed';
  }

  return null;
}

/** Hostnames are checked at parse time only; DNS rebinding is an accepted risk because URLs are proxied to Runware, never fetched here. */
export function isBlockedUrl(urlString: string): boolean {
  return rejectUrl(urlString) !== null;
}

export function validateUrl(urlString: string): void {
  const rejection = rejectUrl(urlString);

  if (rejection !== null) {
    throw new RunwareApiError(rejection);
  }
}

export function sanitizeUrl(urlString: string): string {
  validateUrl(urlString);

  const url = new URL(urlString);
  url.username = '';
  url.password = '';

  return url.toString();
}

export interface UrlValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly normalizedUrl?: string;
}

export function validateUrlWithResult(urlString: string): UrlValidationResult {
  const rejection = rejectUrl(urlString);

  if (rejection !== null) {
    return { isValid: false, error: rejection };
  }

  return { isValid: true, normalizedUrl: sanitizeUrl(urlString) };
}
