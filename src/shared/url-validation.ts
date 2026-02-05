/**
 * URL validation module for the Runware MCP server.
 *
 * Provides SSRF (Server-Side Request Forgery) protection by validating
 * URLs before making outbound requests.
 */

import { RunwareApiError } from './errors.js';

// ============================================================================
// Private IP Ranges
// ============================================================================

/**
 * IPv4 private network ranges.
 * These should never be accessed from a server making external requests.
 */
const PRIVATE_IPV4_RANGES = [
  // 10.0.0.0 - 10.255.255.255 (Class A private)
  { start: 0x0A_00_00_00, end: 0x0A_FF_FF_FF },
  // 172.16.0.0 - 172.31.255.255 (Class B private)
  { start: 0xAC_10_00_00, end: 0xAC_1F_FF_FF },
  // 192.168.0.0 - 192.168.255.255 (Class C private)
  { start: 0xC0_A8_00_00, end: 0xC0_A8_FF_FF },
  // 127.0.0.0 - 127.255.255.255 (Loopback)
  { start: 0x7F_00_00_00, end: 0x7F_FF_FF_FF },
  // 169.254.0.0 - 169.254.255.255 (Link-local)
  { start: 0xA9_FE_00_00, end: 0xA9_FE_FF_FF },
  // 0.0.0.0 - 0.255.255.255 (Current network)
  { start: 0x00_00_00_00, end: 0x00_FF_FF_FF },
] as const;

/**
 * AWS metadata IP address.
 * Used in SSRF attacks to extract instance credentials.
 * This IP is intentionally hardcoded as it's a well-known SSRF target.
 */
// eslint-disable-next-line sonarjs/no-hardcoded-ip -- This is an intentional blocklist entry
const AWS_METADATA_IP = '169.254.169.254';

/**
 * Alibaba Cloud metadata IP address.
 * This IP is intentionally hardcoded as it's a well-known SSRF target.
 */
// eslint-disable-next-line sonarjs/no-hardcoded-ip -- This is an intentional blocklist entry
const ALIBABA_METADATA_IP = '100.100.100.200';

/**
 * Cloud provider metadata endpoints.
 * These are commonly used in SSRF attacks to extract instance credentials.
 */
const METADATA_HOSTNAMES = new Set([
  // AWS, Azure, DigitalOcean, Oracle Cloud
  AWS_METADATA_IP,
  'metadata.google.internal',
  'metadata.goog',
  // Azure
  'metadata.azure.com',
  // Alibaba Cloud
  ALIBABA_METADATA_IP,
  // Kubernetes
  'kubernetes.default.svc',
  'kubernetes.default',
]);

/**
 * Blocked hostname patterns (case-insensitive).
 */
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^localhost\./i,
  /\.localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^\[::1]$/,
  /^0\.0\.0\.0$/,
  /^internal$/i,
  /\.internal$/i,
  /^local$/i,
  /\.local$/i,
] as const;

/**
 * Blocked URL schemes.
 */
const BLOCKED_SCHEMES = new Set([
  'file:',
  'ftp:',
  'gopher:',
  'data:',
  // These are eval-like schemes that could be dangerous
  'vbscript:',
  'about:',
  'blob:',
]);

// ============================================================================
// IP Address Utilities
// ============================================================================

/**
 * Parses an IPv4 address string to a 32-bit integer.
 *
 * @param ip - IPv4 address string (e.g., "192.168.1.1")
 * @returns 32-bit integer representation, or null if invalid
 */
function parseIPv4(ip: string): number | null {
  const parts = ip.split('.');

  if (parts.length !== 4) {
    return null;
  }

  let result = 0;
  for (const part of parts) {
    const num = Number(part);
    if (!Number.isInteger(num) || num < 0 || num > 255) {
      return null;
    }
    result = (result << 8) | num;
  }

  // Handle JavaScript's signed 32-bit integers by converting to unsigned
  return result >>> 0;
}

/**
 * Checks if an IPv4 address is in a private range.
 *
 * @param ip - IPv4 address string
 * @returns true if the IP is in a private range
 */
export function isPrivateIP(ip: string): boolean {
  const ipNum = parseIPv4(ip);

  if (ipNum === null) {
    // If we can't parse it, be conservative and block it
    // This handles IPv6 and malformed addresses
    return isIPv6Private(ip);
  }

  for (const range of PRIVATE_IPV4_RANGES) {
    if (ipNum >= range.start && ipNum <= range.end) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if an IPv6 address is private/local.
 *
 * @param ip - IPv6 address string
 * @returns true if the IP is private/local
 */
function isIPv6Private(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback
  if (normalized === '::1' || normalized === '[::1]') {
    return true;
  }

  // Link-local (fe80::/10)
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // Unique local (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const ipv4MappedRegex = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
  const ipv4Mapped = ipv4MappedRegex.exec(normalized);
  if (ipv4Mapped?.[1] !== undefined) {
    return isPrivateIP(ipv4Mapped[1]);
  }

  return false;
}

// ============================================================================
// Hostname Validation
// ============================================================================

/**
 * Checks if a hostname is a cloud metadata endpoint.
 *
 * @param hostname - Hostname to check
 * @returns true if the hostname is a metadata endpoint
 */
export function isMetadataEndpoint(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return METADATA_HOSTNAMES.has(normalized);
}

/**
 * Checks if a hostname matches any blocked pattern.
 *
 * @param hostname - Hostname to check
 * @returns true if the hostname is blocked
 */
function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  // Check exact matches
  if (METADATA_HOSTNAMES.has(normalized)) {
    return true;
  }

  // Check patterns
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // Check if it's a private IP
  if (isPrivateIP(hostname)) {
    return true;
  }

  return false;
}

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Checks if a URL should be blocked for SSRF protection.
 *
 * @param urlString - URL string to check
 * @returns true if the URL should be blocked
 */
export function isBlockedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Check scheme
    if (BLOCKED_SCHEMES.has(url.protocol)) {
      return true;
    }

    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return true;
    }

    // Check hostname
    if (isBlockedHostname(url.hostname)) {
      return true;
    }

    // Check for username/password in URL (often used in SSRF attacks)
    if (url.username !== '' || url.password !== '') {
      return true;
    }

    return false;
  } catch {
    // Invalid URL - block it
    return true;
  }
}

/**
 * Validates a URL for safe external access.
 *
 * @param urlString - URL string to validate
 * @throws RunwareApiError if the URL is blocked
 */
export function validateUrl(urlString: string): void {
  // First, try to parse the URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new RunwareApiError('Invalid URL format');
  }

  // Check scheme
  if (BLOCKED_SCHEMES.has(url.protocol)) {
    throw new RunwareApiError(`URL scheme "${url.protocol}" is not allowed`);
  }

  // Only allow http and https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new RunwareApiError('Only http and https URLs are allowed');
  }

  // Check for credentials in URL
  if (url.username !== '' || url.password !== '') {
    throw new RunwareApiError('URLs with embedded credentials are not allowed');
  }

  // Check hostname against blocklist
  const hostname = url.hostname.toLowerCase();

  if (METADATA_HOSTNAMES.has(hostname)) {
    throw new RunwareApiError('Access to cloud metadata endpoints is not allowed');
  }

  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new RunwareApiError('Access to local/internal hosts is not allowed');
    }
  }

  // Check if hostname is a private IP
  if (isPrivateIP(hostname)) {
    throw new RunwareApiError('Access to private IP addresses is not allowed');
  }

  // Check for IPv6 private addresses
  if (isIPv6Private(hostname)) {
    throw new RunwareApiError('Access to private IPv6 addresses is not allowed');
  }
}

// ============================================================================
// URL Sanitization
// ============================================================================

/**
 * Sanitizes a URL by removing potentially dangerous components.
 *
 * @param urlString - URL string to sanitize
 * @returns Sanitized URL string
 * @throws RunwareApiError if the URL cannot be sanitized
 */
export function sanitizeUrl(urlString: string): string {
  // Validate first
  validateUrl(urlString);

  // Parse and reconstruct to normalize
  const url = new URL(urlString);

  // Remove credentials
  url.username = '';
  url.password = '';

  // Normalize path (remove .. and .)
  // URL constructor already does some normalization

  return url.toString();
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of URL validation.
 */
export interface UrlValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly normalizedUrl?: string;
}

/**
 * Validates a URL and returns a detailed result.
 *
 * @param urlString - URL string to validate
 * @returns Validation result with error details
 */
export function validateUrlWithResult(urlString: string): UrlValidationResult {
  try {
    validateUrl(urlString);
    return {
      isValid: true,
      normalizedUrl: sanitizeUrl(urlString),
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
