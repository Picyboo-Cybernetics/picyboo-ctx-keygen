import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INFO_NAMESPACE,
  DEFAULT_LENGTH,
  SUPPORTED_ENCODINGS,
  benchmarkDerivation,
  deriveCtxBatch,
  deriveCtxKey,
  hkdfSha256,
  normalizeSeed,
  validateSeed,
} from '../src/index.js';

describe('seed hygiene', () => {
  it('normalizes various inputs into strings', () => {
    expect(normalizeSeed('  hello  ')).toBe('hello');
    expect(normalizeSeed(12345)).toBe('12345');
    expect(normalizeSeed(Uint8Array.from([65, 66, 67, 68]))).toBe('ABCD');
  });

  it('validates seed boundaries', () => {
    expect(validateSeed('short').ok).toBe(false);
    const longSeed = 'a'.repeat(257);
    expect(validateSeed(longSeed).ok).toBe(false);
    expect(validateSeed('perfectly-fine-seed').ok).toBe(true);
  });
});

describe('CTX derivations', () => {
  const seed = 'picyboo-demo-seed';

  it('derives deterministic keys across multiple indices', async () => {
    const keys = await deriveCtxBatch({ seed, count: 3 });
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
    keys.forEach((key) => expect(key).toMatch(/^[0-9a-f]{64}$/));
  });

  it('derives metadata-aware payloads when requested', async () => {
    const payload = await deriveCtxBatch({ seed, count: 2, includeMetadata: true, encoding: 'base64' });
    expect(payload).toEqual([
      {
        index: 0,
        info: `${DEFAULT_INFO_NAMESPACE}:0`,
        encoding: 'base64',
        key: expect.stringMatching(/^[0-9a-zA-Z+/=]+$/),
      },
      {
        index: 1,
        info: `${DEFAULT_INFO_NAMESPACE}:1`,
        encoding: 'base64',
        key: expect.stringMatching(/^[0-9a-zA-Z+/=]+$/),
      },
    ]);
  });

  it('throws when unsupported encoding is requested', async () => {
    await expect(deriveCtxBatch({ seed, encoding: 'binary' })).rejects.toThrow(/Encoding must be one of/);
  });

  it('supports deriving a single key', async () => {
    const key = await deriveCtxKey({ seed, index: 42, encoding: 'hex', length: DEFAULT_LENGTH });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('hkdf primitives', () => {
  it('produces correct length output by default', async () => {
    const hex = await hkdfSha256('input');
    expect(hex).toHaveLength(DEFAULT_LENGTH * 2);
  });

  it('benchmarks repeated derivations', async () => {
    const stats = await benchmarkDerivation({ seed: 'benchmark-seed', iterations: 5 });
    expect(stats.iterations).toBe(5);
    expect(stats.durationMs).toBeGreaterThanOrEqual(0);
    expect(stats.avgPerIterationMs).toBeGreaterThanOrEqual(0);
    expect(stats.throughputPerSecond).toBeGreaterThan(0);
  });

  it('enumerates supported encodings', () => {
    expect(SUPPORTED_ENCODINGS).toContain('hex');
    expect(SUPPORTED_ENCODINGS).toContain('base64');
    expect(SUPPORTED_ENCODINGS).toContain('raw');
  });
});
