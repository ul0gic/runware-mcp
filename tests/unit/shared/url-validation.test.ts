import { describe, it, expect } from 'vitest';

import {
  isBlockedUrl,
  isPrivateIP,
  isMetadataEndpoint,
  validateUrl,
  sanitizeUrl,
  validateUrlWithResult,
} from '../../../src/shared/url-validation.js';
import { RunwareApiError } from '../../../src/shared/errors.js';

// ============================================================================
// Valid URLs
// ============================================================================

describe('validateUrl - valid URLs', () => {
  it('accepts HTTPS URL', () => {
    expect(() => validateUrl('https://example.com/image.png')).not.toThrow();
  });

  it('accepts HTTP URL', () => {
    expect(() => validateUrl('http://example.com/path')).not.toThrow();
  });

  it('accepts URL with port', () => {
    expect(() => validateUrl('https://example.com:8443/api')).not.toThrow();
  });

  it('accepts URL with query params', () => {
    expect(() => validateUrl('https://example.com/path?key=value')).not.toThrow();
  });

  it('accepts URL with fragment', () => {
    expect(() => validateUrl('https://example.com/path#section')).not.toThrow();
  });
});

// ============================================================================
// Invalid Protocols
// ============================================================================

describe('validateUrl - invalid protocols', () => {
  it('rejects ftp protocol', () => {
    expect(() => validateUrl('ftp://example.com/file')).toThrow(RunwareApiError);
  });

  it('rejects file protocol', () => {
    expect(() => validateUrl('file:///etc/passwd')).toThrow(RunwareApiError);
  });

  it('rejects data protocol', () => {
    expect(() => validateUrl('data:text/html,<h1>test</h1>')).toThrow(RunwareApiError);
  });

  it('rejects gopher protocol', () => {
    expect(() => validateUrl('gopher://example.com')).toThrow(RunwareApiError);
  });
});

// ============================================================================
// Malformed URLs
// ============================================================================

describe('validateUrl - malformed URLs', () => {
  it('rejects empty string', () => {
    expect(() => validateUrl('')).toThrow(RunwareApiError);
  });

  it('rejects non-URL string', () => {
    expect(() => validateUrl('not a url')).toThrow(RunwareApiError);
  });

  it('rejects URL with credentials', () => {
    expect(() => validateUrl('https://user:pass@example.com')).toThrow(RunwareApiError);
  });

  it('rejects URL with only username', () => {
    expect(() => validateUrl('https://user@example.com')).toThrow(RunwareApiError);
  });
});

// ============================================================================
// SSRF Protection - localhost
// ============================================================================

describe('validateUrl - SSRF localhost', () => {
  it('rejects localhost', () => {
    expect(() => validateUrl('http://localhost/api')).toThrow(RunwareApiError);
  });

  it('rejects 127.0.0.1', () => {
    expect(() => validateUrl('http://127.0.0.1/api')).toThrow(RunwareApiError);
  });

  it('rejects 127.x.x.x range', () => {
    expect(() => validateUrl('http://127.0.0.2')).toThrow(RunwareApiError);
  });

  it('rejects [::1]', () => {
    expect(() => validateUrl('http://[::1]/api')).toThrow(RunwareApiError);
  });

  it('rejects 0.0.0.0', () => {
    expect(() => validateUrl('http://0.0.0.0/api')).toThrow(RunwareApiError);
  });
});

// ============================================================================
// SSRF Protection - private IPs
// ============================================================================

describe('validateUrl - SSRF private IPs', () => {
  it('rejects 10.x.x.x', () => {
    expect(() => validateUrl('http://10.0.0.1')).toThrow(RunwareApiError);
  });

  it('rejects 172.16.x.x', () => {
    expect(() => validateUrl('http://172.16.0.1')).toThrow(RunwareApiError);
  });

  it('rejects 172.31.x.x', () => {
    expect(() => validateUrl('http://172.31.255.255')).toThrow(RunwareApiError);
  });

  it('rejects 192.168.x.x', () => {
    expect(() => validateUrl('http://192.168.1.1')).toThrow(RunwareApiError);
  });

  it('rejects 169.254.x.x link-local', () => {
    expect(() => validateUrl('http://169.254.1.1')).toThrow(RunwareApiError);
  });
});

// ============================================================================
// SSRF Protection - cloud metadata
// ============================================================================

describe('validateUrl - SSRF cloud metadata', () => {
  it('rejects AWS metadata endpoint', () => {
    expect(() => validateUrl('http://169.254.169.254/latest/meta-data')).toThrow(
      RunwareApiError,
    );
  });

  it('rejects Google metadata endpoint', () => {
    expect(() => validateUrl('http://metadata.google.internal')).toThrow(
      RunwareApiError,
    );
  });

  it('rejects Alibaba metadata endpoint', () => {
    expect(() => validateUrl('http://100.100.100.200')).toThrow(RunwareApiError);
  });
});

// ============================================================================
// isBlockedUrl
// ============================================================================

describe('isBlockedUrl', () => {
  it('returns false for valid public URL', () => {
    expect(isBlockedUrl('https://example.com')).toBe(false);
  });

  it('returns true for localhost', () => {
    expect(isBlockedUrl('http://localhost')).toBe(true);
  });

  it('returns true for private IP', () => {
    expect(isBlockedUrl('http://192.168.1.1')).toBe(true);
  });

  it('returns true for invalid URL', () => {
    expect(isBlockedUrl('not-a-url')).toBe(true);
  });

  it('returns true for blocked scheme', () => {
    expect(isBlockedUrl('file:///etc/passwd')).toBe(true);
  });

  it('returns true for URL with credentials', () => {
    expect(isBlockedUrl('https://user:pass@example.com')).toBe(true);
  });
});

// ============================================================================
// isPrivateIP
// ============================================================================

describe('isPrivateIP', () => {
  it('returns true for 10.x.x.x', () => {
    expect(isPrivateIP('10.0.0.1')).toBe(true);
    expect(isPrivateIP('10.255.255.255')).toBe(true);
  });

  it('returns true for 172.16-31.x.x', () => {
    expect(isPrivateIP('172.16.0.1')).toBe(true);
    expect(isPrivateIP('172.31.255.255')).toBe(true);
  });

  it('returns false for 172.32.x.x', () => {
    expect(isPrivateIP('172.32.0.1')).toBe(false);
  });

  it('returns true for 192.168.x.x', () => {
    expect(isPrivateIP('192.168.0.1')).toBe(true);
  });

  it('returns true for loopback', () => {
    expect(isPrivateIP('127.0.0.1')).toBe(true);
    expect(isPrivateIP('127.255.255.255')).toBe(true);
  });

  it('returns false for public IP', () => {
    expect(isPrivateIP('8.8.8.8')).toBe(false);
    expect(isPrivateIP('1.1.1.1')).toBe(false);
  });

  it('returns true for link-local', () => {
    expect(isPrivateIP('169.254.0.1')).toBe(true);
  });

  it('handles IPv6 loopback', () => {
    expect(isPrivateIP('::1')).toBe(true);
  });

  it('handles IPv6 link-local', () => {
    expect(isPrivateIP('fe80::1')).toBe(true);
  });

  it('handles IPv6 unique-local', () => {
    expect(isPrivateIP('fd00::1')).toBe(true);
  });
});

// ============================================================================
// isMetadataEndpoint
// ============================================================================

describe('isMetadataEndpoint', () => {
  it('detects AWS metadata IP', () => {
    expect(isMetadataEndpoint('169.254.169.254')).toBe(true);
  });

  it('detects Google metadata', () => {
    expect(isMetadataEndpoint('metadata.google.internal')).toBe(true);
  });

  it('returns false for regular hostname', () => {
    expect(isMetadataEndpoint('example.com')).toBe(false);
  });
});

// ============================================================================
// sanitizeUrl
// ============================================================================

describe('sanitizeUrl', () => {
  it('returns normalized URL string', () => {
    const sanitized = sanitizeUrl('https://example.com/path');
    expect(sanitized).toBe('https://example.com/path');
  });

  it('throws for blocked URL', () => {
    expect(() => sanitizeUrl('http://localhost')).toThrow(RunwareApiError);
  });
});

// ============================================================================
// validateUrlWithResult
// ============================================================================

describe('validateUrlWithResult', () => {
  it('returns valid result for good URL', () => {
    const result = validateUrlWithResult('https://example.com');
    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('returns invalid result for bad URL', () => {
    const result = validateUrlWithResult('http://localhost');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.normalizedUrl).toBeUndefined();
  });

  it('returns invalid result for malformed URL', () => {
    const result = validateUrlWithResult('not a url');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
