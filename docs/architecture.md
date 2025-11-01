# CTX Architecture Overview

The CTX (context) key schedule exists to let independent workloads derive the same symmetric key material when they share a deterministic seed. The high-level flow is:

1. **Seed acquisition** – A deterministic but well-governed identifier (typically tenant ID + environment) is provided by upstream identity systems.
2. **Validation & normalization** – Integrators must pass seeds through the `validateSeed` helper which enforces length and printable-character constraints.
3. **Derivation** – HKDF-SHA256 is executed with the shared salt `picyboo.ctx` and an info namespace of `CTX:<index>`. Each microservice chooses an index to represent rotation windows or sub-components.
4. **Consumption** – The derived key is consumed by the specific workload (e.g., encrypting document metadata, seeding feature flags, or generating deterministic API credentials).
5. **Observability** – Benchmark telemetry and audit logs record the derivation throughput and seed health without capturing the key material itself.

```
┌───────────────────────┐       ┌────────────────────┐       ┌──────────────────────┐
│ Identity / Tenant API │──────▶│ Seed Normalization │──────▶│ CTX HKDF Derivation │
└───────────────────────┘       └────────────────────┘       └──────────┬───────────┘
                                                                        │
                                                                        ▼
                                                     ┌──────────────────────────────┐
                                                     │ Workload (encryption, auth) │
                                                     └──────────────────────────────┘
```

## Namespaces & rotation

- `CTX:0` – Primary operational key (default)
- `CTX:1` – Shadow/preview key for staged changes
- `CTX:2+` – Custom rotations (hourly, per-region, etc.)

All namespaces are deterministic. Consumers should coordinate index usage through product governance (outside the scope of this repo).

## Integration surfaces

| Surface | Expected usage |
|---------|----------------|
| Library (`src/index.js`) | Programmatic derivations with validation & metrics |
| CLI (`bin/cli.js`) | Demo tooling, operational scripts, audits |
| Bench script (`scripts/bench.mjs`) | Performance baselines and regression comparisons |
| Example (`examples/ctx-profile.mjs`) | Self-contained scenario for partner enablement |

## Security notes

- The repo never stores seeds or outputs beyond the runtime scope of commands.
- Consumers are responsible for managing salts if they deviate from the default.
- Observability data should avoid logging raw seeds; hash them if logs are mandatory.
