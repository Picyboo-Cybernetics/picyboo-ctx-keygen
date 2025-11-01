#!/usr/bin/env node
import { createRequire } from 'node:module';
import { program } from 'commander';
import {
  SUPPORTED_ENCODINGS,
  benchmarkDerivation,
  deriveCtxBatch,
  deriveCtxKey,
  normalizeSeed,
  validateSeed,
} from '../src/index.js';

const require = createRequire(import.meta.url);
const { version, description } = require('../package.json');

program
  .name('pbctx')
  .description(description)
  .version(version);

program.addHelpText('after', `\nExamples:\n  pbctx derive --seed "demo@example.com" --count 3 --encoding base64\n  pbctx inspect --seed "investor-preview"\n  pbctx bench --seed "demo@example.com" --iterations 250\n`);

program
  .command('derive')
  .description('Generate one or more CTX keys')
  .requiredOption('--seed <seed>', 'Customer or tenant scoped seed')
  .option('--count <n>', 'Number of keys to derive', '1')
  .option('--salt <salt>', 'HKDF salt', undefined)
  .option('--namespace <ns>', 'Info namespace prefix', undefined)
  .option('--length <bytes>', 'Output length in bytes', undefined)
  .option('--encoding <format>', `Output encoding (${SUPPORTED_ENCODINGS.join(', ')})`, 'hex')
  .option('--metadata', 'Include metadata in the output', false)
  .option('--json', 'Emit JSON instead of plain text', false)
  .option('--pretty', 'Pretty-print JSON output', false)
  .action(async (opts) => {
    try {
      const { seed, count, salt, namespace, length, encoding, metadata, json, pretty } = opts;
      const batch = await deriveCtxBatch({
        seed,
        count,
        salt: salt ?? undefined,
        namespace: namespace ?? undefined,
        length: length ? Number(length) : undefined,
        encoding,
        includeMetadata: Boolean(metadata),
      });
      if (json || metadata) {
        const payload = metadata ? batch : batch.map((key, index) => ({ index, key }));
        const spacing = pretty ? 2 : 0;
        console.log(JSON.stringify(payload, null, spacing));
      } else {
        console.log(batch.join('\n'));
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('inspect')
  .description('Validate a seed and preview deterministic derivations')
  .requiredOption('--seed <seed>', 'Seed to inspect')
  .option('--count <n>', 'Preview this many keys', '3')
  .action(async (opts) => {
    const normalized = normalizeSeed(opts.seed);
    const validation = validateSeed(normalized);
    if (!validation.ok) {
      console.error(`Seed invalid: ${validation.reason}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Seed OK (normalized length=${validation.normalized.length})`);
    const count = Number(opts.count) || 3;
    const preview = await deriveCtxBatch({ seed: validation.normalized, count, includeMetadata: true });
    preview.forEach((entry) => {
      console.log(`#${entry.index} (${entry.info}) => ${entry.key}`);
    });
  });

program
  .command('single')
  .description('Derive a single key with explicit parameters')
  .requiredOption('--seed <seed>')
  .option('--index <n>', 'Key index (default: 0)', '0')
  .option('--salt <salt>', 'HKDF salt', undefined)
  .option('--namespace <ns>', 'Info namespace prefix', undefined)
  .option('--length <bytes>', 'Output length in bytes', undefined)
  .option('--encoding <format>', `Output encoding (${SUPPORTED_ENCODINGS.join(', ')})`, 'hex')
  .action(async (opts) => {
    try {
      const { seed, index, salt, namespace, length, encoding } = opts;
      const key = await deriveCtxKey({
        seed,
        index: Number(index) || 0,
        salt: salt ?? undefined,
        namespace: namespace ?? undefined,
        length: length ? Number(length) : undefined,
        encoding,
      });
      if (encoding === 'raw') {
        process.stdout.write(key);
      } else {
        console.log(key);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('bench')
  .description('Benchmark repeated derivations for observability baselines')
  .requiredOption('--seed <seed>', 'Seed to derive with')
  .option('--iterations <n>', 'Number of derivations to execute', '100')
  .option('--namespace <ns>', 'Info namespace prefix', undefined)
  .option('--salt <salt>', 'HKDF salt', undefined)
  .option('--length <bytes>', 'Output length in bytes', undefined)
  .action(async (opts) => {
    try {
      const stats = await benchmarkDerivation({
        seed: opts.seed,
        iterations: opts.iterations,
        namespace: opts.namespace ?? undefined,
        salt: opts.salt ?? undefined,
        length: opts.length ? Number(opts.length) : undefined,
      });
      console.log(JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
    }
  });

program.parse();
