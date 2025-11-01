export type SupportedEncoding = 'hex' | 'base64' | 'raw';

export interface DeriveCtxKeyOptions {
  seed: string | number | Uint8Array | Buffer;
  index?: number;
  salt?: string | Uint8Array | Buffer;
  namespace?: string;
  length?: number;
  encoding?: SupportedEncoding;
}

export interface DeriveCtxBatchOptions extends Omit<DeriveCtxKeyOptions, 'index'> {
  count?: number;
  includeMetadata?: boolean;
}

export interface DerivedKeyMetadata {
  index: number;
  info: string;
  encoding: SupportedEncoding;
  key: string | Uint8Array;
}

export interface BenchmarkOptions {
  seed: string | number | Uint8Array | Buffer;
  iterations?: number;
  namespace?: string;
  salt?: string | Uint8Array | Buffer;
  length?: number;
}

export interface HkdfOptions {
  salt?: string | Uint8Array | Buffer;
  info?: string | Uint8Array | Buffer;
  length?: number;
}

export interface BenchmarkStats {
  iterations: number;
  durationMs: number;
  avgPerIterationMs: number;
  throughputPerSecond: number;
}

export const DEFAULT_SALT: string;
export const DEFAULT_INFO_NAMESPACE: string;
export const DEFAULT_LENGTH: number;
export const SUPPORTED_ENCODINGS: readonly SupportedEncoding[];

export function normalizeSeed(seed: unknown): string;
export function validateSeed(seed: unknown): { ok: true; normalized: string } | { ok: false; reason: string };
export function deriveCtxKey(options: DeriveCtxKeyOptions): Promise<string | Uint8Array>;
export function deriveCtxBatch(options: DeriveCtxBatchOptions): Promise<Array<string | Uint8Array | DerivedKeyMetadata>>;
export function deriveCTX(seed: unknown, count?: number): Promise<string[]>;
export function hkdfSha256(ikm: string | Uint8Array | Buffer, options?: HkdfOptions): Promise<string>;
export function benchmarkDerivation(options: BenchmarkOptions): Promise<BenchmarkStats>;

declare const _default: {
  DEFAULT_SALT: typeof DEFAULT_SALT;
  DEFAULT_INFO_NAMESPACE: typeof DEFAULT_INFO_NAMESPACE;
  DEFAULT_LENGTH: typeof DEFAULT_LENGTH;
  SUPPORTED_ENCODINGS: typeof SUPPORTED_ENCODINGS;
  normalizeSeed: typeof normalizeSeed;
  validateSeed: typeof validateSeed;
  deriveCtxKey: typeof deriveCtxKey;
  deriveCtxBatch: typeof deriveCtxBatch;
  deriveCTX: typeof deriveCTX;
  hkdfSha256: typeof hkdfSha256;
  benchmarkDerivation: typeof benchmarkDerivation;
};

export default _default;
