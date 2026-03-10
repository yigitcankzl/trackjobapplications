/**
 * Unit tests for content/sanitize.js
 *
 * Because these functions run as plain scripts injected into web pages,
 * we inline equivalent implementations here so tests run without a browser.
 * The implementations MUST stay in sync with content/sanitize.js.
 */

import { describe, it, expect } from 'vitest'

// ── Inline implementations (mirrored from content/sanitize.js) ────

function sanitizeText(value, maxLength = 200) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength)
}

function sanitizeUrl(value, allowedHostnames) {
  if (typeof value !== 'string' || value.length > 2048) return ''
  let parsed
  try {
    parsed = new URL(value)
  } catch (_) {
    return ''
  }
  if (parsed.protocol !== 'https:') return ''
  if (allowedHostnames && allowedHostnames.length > 0) {
    const host = parsed.hostname.toLowerCase()
    const allowed = allowedHostnames.some(
      h => host === h || host.endsWith('.' + h)
    )
    if (!allowed) return ''
  }
  if (parsed.href.length > 2048) return ''
  return parsed.href
}

// ── sanitizeUrl ────────────────────────────────────────────────────

describe('sanitizeUrl', () => {
  it('rejects http scheme', () => {
    expect(sanitizeUrl('http://indeed.com/job/123', ['indeed.com'])).toBe('')
  })

  it('rejects javascript: scheme', () => {
    expect(sanitizeUrl('javascript:alert(1)', ['indeed.com'])).toBe('')
  })

  it('rejects data: URIs', () => {
    expect(sanitizeUrl('data:text/html,<h1>xss</h1>', ['linkedin.com'])).toBe('')
  })

  it('rejects non-allowed hostname', () => {
    expect(sanitizeUrl('https://evil.com/jobs/view/123', ['linkedin.com'])).toBe('')
  })

  it('accepts exact hostname match', () => {
    const url = 'https://linkedin.com/jobs/view/123/'
    expect(sanitizeUrl(url, ['linkedin.com'])).toBe(url)
  })

  it('accepts www subdomain', () => {
    const url = 'https://www.linkedin.com/jobs/view/123/'
    expect(sanitizeUrl(url, ['linkedin.com'])).toBe(url)
  })

  it('accepts deep subdomain', () => {
    const url = 'https://uk.indeed.com/viewjob?jk=abc'
    expect(sanitizeUrl(url, ['indeed.com'])).toBe(url)
  })

  it('rejects crafted subdomain bypass (evil.linkedin.com.attacker.com)', () => {
    expect(
      sanitizeUrl('https://evil.linkedin.com.attacker.com/jobs', ['linkedin.com'])
    ).toBe('')
  })

  it('rejects URL longer than 2048 chars', () => {
    const long = 'https://linkedin.com/jobs/' + 'a'.repeat(2030)
    expect(sanitizeUrl(long, ['linkedin.com'])).toBe('')
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeUrl(null, ['linkedin.com'])).toBe('')
    expect(sanitizeUrl(42, ['linkedin.com'])).toBe('')
  })

  it('accepts any https URL when no allowedHostnames given', () => {
    const url = 'https://example.com/path'
    expect(sanitizeUrl(url, [])).toBe(url)
  })
})

// ── sanitizeText ───────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  Senior Engineer  ')).toBe('Senior Engineer')
  })

  it('strips C0 control characters', () => {
    expect(sanitizeText('Good\x00Corp')).toBe('GoodCorp')
  })

  it('strips BEL and BS', () => {
    expect(sanitizeText('Test\x07\x08Company')).toBe('TestCompany')
  })

  it('preserves newlines (0x0A) before trim', () => {
    // Newlines at the start/end are trimmed; in the middle they survive
    expect(sanitizeText('Line1\nLine2')).toBe('Line1\nLine2')
  })

  it('enforces maxLength', () => {
    expect(sanitizeText('a'.repeat(300))).toHaveLength(200)
    expect(sanitizeText('a'.repeat(300), 50)).toHaveLength(50)
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
    expect(sanitizeText(42)).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('')
  })
})

// ── service-worker validation helpers (inlined) ───────────────────

const MAX_TEXT_LENGTH = 200
const MAX_URL_LENGTH = 2048
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const VALID_STATUSES = new Set(['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'])
const VALID_SOURCES = new Set(['linkedin', 'indeed', 'email', 'referral', 'company_site', 'other'])

function validateText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength)
}

function validateUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return ''
  let parsed
  try { parsed = new URL(value) } catch (_) { return '' }
  if (parsed.protocol !== 'https:') return ''
  return parsed.href
}

function validateDate(value) {
  if (typeof value === 'string' && DATE_RE.test(value)) return value
  return new Date().toISOString().split('T')[0]
}

describe('validateUrl (service-worker)', () => {
  it('rejects http', () => expect(validateUrl('http://api.example.com')).toBe(''))
  it('rejects javascript:', () => expect(validateUrl('javascript:void(0)')).toBe(''))
  it('accepts https', () => {
    expect(validateUrl('https://api.example.com/v1')).toBe('https://api.example.com/v1')
  })
  it('returns empty for non-string', () => expect(validateUrl(123)).toBe(''))
})

describe('validateDate (service-worker)', () => {
  it('accepts YYYY-MM-DD', () => expect(validateDate('2024-06-15')).toBe('2024-06-15'))
  it('rejects arbitrary strings', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(validateDate('not-a-date')).toBe(today)
  })
  it('rejects injection attempt', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(validateDate("'; DROP TABLE--")).toBe(today)
  })
})

describe('VALID_STATUSES / VALID_SOURCES sets', () => {
  it('contains expected statuses', () => {
    for (const s of ['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']) {
      expect(VALID_STATUSES.has(s)).toBe(true)
    }
  })
  it('rejects unknown status', () => expect(VALID_STATUSES.has('hacked')).toBe(false))
  it('contains expected sources', () => {
    for (const s of ['linkedin', 'indeed', 'email', 'referral', 'company_site', 'other']) {
      expect(VALID_SOURCES.has(s)).toBe(true)
    }
  })
})
