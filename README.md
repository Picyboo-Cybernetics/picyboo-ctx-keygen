<h1 align="center">PICYBOO™ Contextual Keygen (CTX)</h1>

> Deterministic HKDF-SHA256 derivations for privacy-preserving context binding across the PICYBOO security platform.

---

## Why this repository exists

PICYBOO's patent filings reference a "CTX" (context) key schedule that allows product surfaces to deterministically derive tenant-scoped encryption keys without ever persisting master secrets. This repository documents that interface for regulators, partners, and investors without revealing proprietary workloads.

The intent is to demonstrate our cryptographic hygiene, expected integrations, and the kind of observability we maintain around key lifecycle events—while keeping the underlying product roadmap private.

## Key capabilities

- **HKDF-SHA256 core** – Standards-compliant HKDF implementation built on WebCrypto (Node 18+/Browsers). Tested against RFC 5869 vectors.
- **Context-aware derivations** – Deterministic namespacing (`CTX:<index>`) so distributed workloads can agree on the same key material without coordination.
- **Professional CLI tooling** – `pbctx` command with subcommands for derivation, inspection, and benchmarking, suitable for demos and internal automation.
- **Library ergonomics** – Input validation, multiple encodings (hex, base64, raw), metadata-rich responses, and optional benchmarking helpers.
- **Quality & governance** – Vitest suite, RFC compliance checks, CLI regression tests, linting, GitHub Actions CI, and ready-to-publish package metadata with TypeScript typings.

## Getting started

```bash
npm install
npm run lint
npm run build   # optional: produces dist/ bundles for CJS consumers
npm test
```

### CLI usage

```bash
# Derive three CTX keys as base64 strings
pbctx derive --seed "customer@example.com" --count 3 --encoding base64

# Validate a seed and preview deterministic keys
pbctx inspect --seed "investor-preview" --count 2

# Benchmark 250 derivations (JSON output)
pbctx bench --seed "customer@example.com" --iterations 250
```

Run `pbctx --help` to see all options. The CLI supports JSON payloads (`--json`, `--pretty`) and metadata-rich outputs (`--metadata`).

### Library usage

```js
import { deriveCtxBatch, deriveCtxKey } from 'picyboo-ctx-keygen';

const customerSeed = 'customer@example.com';

const firstKey = await deriveCtxKey({ seed: customerSeed, index: 0, encoding: 'base64' });
const rotationSet = await deriveCtxBatch({
  seed: customerSeed,
  count: 5,
  namespace: 'CTX',
  encoding: 'hex',
  includeMetadata: true,
});
```

TypeScript projects receive intellisense via the bundled `types/index.d.ts` definitions.

## Architecture snapshot

See [`docs/architecture.md`](./docs/architecture.md) for a contextual overview. Highlights:

1. Deterministic key derivation flows across microservices
2. How observability & audit logs consume CTX metadata
3. Seed hygiene and validation expectations for integrators

A runnable example lives in [`examples/ctx-profile.mjs`](./examples/ctx-profile.mjs), demonstrating derivations and benchmark telemetry.

## Quality & compliance

- ✅ RFC 5869 reference tests (`npm test`)
- ✅ CLI regression tests (`test/cli.spec.js`)
- ✅ Seed hygiene & guardrails (`validateSeed`)
- ✅ Benchmarks for operational baselines (`pbctx bench`, `scripts/bench.mjs`)
- ✅ Automated CI via GitHub Actions (lint + tests)

## Roadmap signals (public)

| Milestone | Status | Notes |
|-----------|--------|-------|
| SDK language parity | 🔄 In discovery | Evaluating Rust & Go ports for edge workloads |
| Secrets governance integration | ✅ Prototype | Internally piloted with SecretsHub |
| CTX telemetry dashboards | 🚧 In progress | Grafana dashboard wireframes in private repo |

## Security posture

- **Deterministic only** – No randomness is introduced beyond the provided seed and HKDF salt/namespace.
- **Seed expectations** – Minimum 8 printable characters; integrators should treat seeds as PII and store them securely.
- **Rotation guidance** – Increment the namespace index for each rotation window (daily/hourly depending on workload).
- **Observability** – Benchmark helper outputs p95 latency approximations to feed SLO dashboards.

## Contributing

This repo primarily serves as documentation, but contributions that improve clarity, compliance, or automation are welcome.

1. Fork & create a feature branch
2. `npm install`
3. `npm run lint && npm test`
4. Open a PR describing the improvement

## License

MIT © PICYBOO Security
