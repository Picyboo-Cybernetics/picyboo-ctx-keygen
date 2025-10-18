#!/usr/bin/env node
import { program } from 'commander';
import { deriveCTX } from '../src/index.js';

program
  .name('pbctx')
  .description('PICYBOO CTX keygen (HKDF-SHA256)')
  .version('0.1.0');

program.addHelpText('after', `
Examples:
  pbctx derive --seed "demo@example.com" --count 2

Notes:
  HKDF-SHA256 (RFC 5869), salt="picyboo.ctx",
  info="CTX:<index>", L=32 (256-bit hex).
`);

program
  .command('derive')
  .requiredOption('--seed <seed>')
  .option('--count <n>', '1')
  .action(async (opts) => {
    const seed = String(opts.seed || '').trim();
    if (!seed) {
      console.error('Error: --seed is required');
      process.exit(2);
    }
    const n = Math.max(1, Math.min(50, parseInt(opts.count, 10) || 1));
    const keys = await deriveCTX(seed, n);
    console.log(keys.join('\n'));
  });

program.parse();
