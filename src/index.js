// src/index.js
const subtle = globalThis.crypto?.subtle ?? globalThis.crypto?.webcrypto?.subtle;
const encoder = new TextEncoder();
const performance = globalThis.performance ?? {
  now: () => {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1000 + nanoseconds / 1e6;
  },
};

export const DEFAULT_SALT = 'picyboo.ctx';
export const DEFAULT_INFO_NAMESPACE = 'CTX';
export const DEFAULT_LENGTH = 32;
export const SUPPORTED_ENCODINGS = Object.freeze(['hex', 'base64', 'raw']);

function assertCrypto() {
  if (!subtle) {
    throw new Error('WebCrypto unavailable (requires Node 18+ or compatible runtime)');
  }
}

export function normalizeSeed(seed) {
  if (seed == null) {
    return '';
  }
  if (typeof seed === 'string') {
    return seed.trim();
  }
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return String(seed);
  }
  if (seed instanceof Uint8Array) {
    return new TextDecoder().decode(seed).trim();
  }
  if (Buffer.isBuffer?.(seed)) {
    return seed.toString('utf8').trim();
  }
  return String(seed ?? '').trim();
}

export function validateSeed(seed) {
  const normalized = normalizeSeed(seed);
  if (!normalized) {
    return { ok: false, reason: 'Seed must not be empty after trimming' };
  }
  if (normalized.length < 8) {
    return { ok: false, reason: 'Seed must be at least 8 characters long' };
  }
  if (normalized.length > 256) {
    return { ok: false, reason: 'Seed must not exceed 256 characters' };
  }
  const printable = /^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u.test(normalized);
  if (!printable) {
    return { ok: false, reason: 'Seed contains non-printable characters' };
  }
  return { ok: true, normalized };
}

function toUint8Array(value) {
  if (typeof value === 'string') {
    return encoder.encode(value);
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  if (Buffer.isBuffer?.(value)) {
    return new Uint8Array(value);
  }
  throw new TypeError('Expected string, Buffer, or Uint8Array');
}

function normalizeLength(length) {
  if (length == null) {
    return DEFAULT_LENGTH;
  }
  const numeric = Number(length);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 1024) {
    throw new Error('Length must be a positive number not exceeding 1024 bytes');
  }
  return Math.floor(numeric);
}

async function hkdfSha256Raw(ikm, { salt = DEFAULT_SALT, info = DEFAULT_INFO_NAMESPACE, length = DEFAULT_LENGTH } = {}) {
  assertCrypto();
  const ikmBytes = toUint8Array(ikm);
  const normalizedLength = normalizeLength(length);
  const saltKey = await subtle.importKey('raw', toUint8Array(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prkBuffer = await subtle.sign('HMAC', saltKey, ikmBytes);
  const prkKey = await subtle.importKey('raw', prkBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const hashLen = 32;
  const blocks = Math.ceil(normalizedLength / hashLen);
  const infoBytes = toUint8Array(info);
  let previous = new Uint8Array(0);
  const out = new Uint8Array(blocks * hashLen);
  let offset = 0;

  for (let block = 1; block <= blocks; block++) {
    const data = new Uint8Array(previous.length + infoBytes.length + 1);
    data.set(previous, 0);
    data.set(infoBytes, previous.length);
    data[data.length - 1] = block;
    previous = new Uint8Array(await subtle.sign('HMAC', prkKey, data));
    out.set(previous, offset);
    offset += hashLen;
  }

  return out.slice(0, normalizedLength);
}

function encodeKeyMaterial(bytes, encoding) {
  switch (encoding) {
    case 'hex':
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    case 'base64':
      return Buffer.from(bytes).toString('base64');
    case 'raw':
      return bytes;
    default:
      throw new Error(`Unsupported encoding: ${encoding}`);
  }
}

function resolveEncoding(encoding = 'hex') {
  const lower = String(encoding).toLowerCase();
  if (!SUPPORTED_ENCODINGS.includes(lower)) {
    throw new Error(`Encoding must be one of: ${SUPPORTED_ENCODINGS.join(', ')}`);
  }
  return lower;
}

export async function deriveCtxKey({
  seed,
  index = 0,
  salt = DEFAULT_SALT,
  namespace = DEFAULT_INFO_NAMESPACE,
  length = DEFAULT_LENGTH,
  encoding = 'hex',
} = {}) {
  const validation = validateSeed(seed);
  if (!validation.ok) {
    throw new Error(`Invalid seed: ${validation.reason}`);
  }
  const normalizedEncoding = resolveEncoding(encoding);
  const normalizedLength = normalizeLength(length);
  const info = `${namespace}:${index}`;
  const bytes = await hkdfSha256Raw(validation.normalized, { salt, info, length: normalizedLength });
  return encodeKeyMaterial(bytes, normalizedEncoding);
}

export async function deriveCtxBatch({
  seed,
  count = 1,
  salt = DEFAULT_SALT,
  namespace = DEFAULT_INFO_NAMESPACE,
  length = DEFAULT_LENGTH,
  encoding = 'hex',
  includeMetadata = false,
} = {}) {
  const validation = validateSeed(seed);
  if (!validation.ok) {
    throw new Error(`Invalid seed: ${validation.reason}`);
  }
  const normalizedEncoding = resolveEncoding(encoding);
  const normalizedLength = normalizeLength(length);
  const total = Math.max(1, Math.min(1000, Number(count) || 1));
  const results = [];

  for (let index = 0; index < total; index++) {
    const info = `${namespace}:${index}`;
    const bytes = await hkdfSha256Raw(validation.normalized, { salt, info, length: normalizedLength });
    const material = encodeKeyMaterial(bytes, normalizedEncoding);
    if (includeMetadata) {
      results.push({ index, info, encoding: normalizedEncoding, key: material });
    } else {
      results.push(material);
    }
  }

  return results;
}

export async function benchmarkDerivation({
  seed,
  iterations = 100,
  namespace = DEFAULT_INFO_NAMESPACE,
  salt = DEFAULT_SALT,
  length = DEFAULT_LENGTH,
} = {}) {
  const validation = validateSeed(seed);
  if (!validation.ok) {
    throw new Error(`Invalid seed: ${validation.reason}`);
  }
  const totalIterations = Math.max(1, Math.min(10000, Number(iterations) || 1));
  const normalizedLength = normalizeLength(length);
  const start = performance.now();
  for (let i = 0; i < totalIterations; i++) {
    await hkdfSha256Raw(validation.normalized, { salt, info: `${namespace}:${i}`, length: normalizedLength });
  }
  const end = performance.now();
  const durationMs = end - start;
  const throughputPerSecond = durationMs === 0 ? Number.POSITIVE_INFINITY : (totalIterations / durationMs) * 1000;
  return {
    iterations: totalIterations,
    durationMs,
    avgPerIterationMs: durationMs / totalIterations,
    throughputPerSecond,
  };
}

export async function deriveCTX(seed, count = 1) {
  return deriveCtxBatch({ seed, count });
}

export async function hkdfSha256(ikm, options) {
  const bytes = await hkdfSha256Raw(ikm, options);
  return encodeKeyMaterial(bytes, 'hex');
}

export default {
  DEFAULT_SALT,
  DEFAULT_INFO_NAMESPACE,
  DEFAULT_LENGTH,
  SUPPORTED_ENCODINGS,
  normalizeSeed,
  validateSeed,
  deriveCtxKey,
  deriveCtxBatch,
  deriveCTX,
  hkdfSha256,
  benchmarkDerivation,
};
