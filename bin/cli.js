#!/usr/bin/env node
import { program } from 'commander';
import { deriveCTX } from '../src/index.js';

program.name('pbctx').description('PICYBOO CTX keygen (HKDF-SHA256)').version('0.1.0');

program.command('derive')
  .requiredOption('--seed <seed>')
  .option('--count <n>', '1')
  .action(async (opts) => {
    const n = parseInt(opts.count, 10) || 1;
    const keys = await deriveCTX(opts.seed, n);
    console.log(keys.join('\n'));
  });

program.parse();
