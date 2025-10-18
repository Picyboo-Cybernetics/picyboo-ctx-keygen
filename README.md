PICYBOO CTX Keygen

Derives 256-bit CTX keys from a seed using HKDF-SHA256.

Status: Archived • Demo only • No support
Trademark: PICYBOO — US 97338199 / CA 2173851

Requires Node.js 18+ (for crypto.subtle).
Algorithm: HKDF-SHA256 (RFC 5869), salt="picyboo.ctx", info="CTX:<index>", L=32.

Install
npm i
npm link # optional to expose 'pbctx' globally

CLI
pbctx derive --seed "demo@example.com" --count 3

Test vector
Seed: test-seed • Salt: picyboo.ctx • Info: CTX:<index> • L=32 bytes

Expected:
CTX:0 → e89c60695ca6e7162ab0f9601df3c78aea7f90bf4ba21cc811eb597df2b54ec3
CTX:1 → ae9c2c6aa904511a500df73d20b97bcf2c386c1fb8d10dedd7875fd7c163295a
CTX:2 → f37f87c9ec822e2bc5939da90379cb3a985a7173828dbbf7d2c1524a9136936b

Verify
npm test
or
node bin/cli.js derive --seed "test-seed" --count 3

Legal
© Picyboo Cybernetics. MIT License.