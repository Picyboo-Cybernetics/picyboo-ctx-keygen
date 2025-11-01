#!/usr/bin/env node
import { benchmarkDerivation } from '../src/index.js';

async function main() {
  const seed = process.argv[2] ?? process.env.PBCTX_SEED;
  if (!seed) {
    console.error('Usage: node scripts/bench.mjs <seed> [iterations=1000]');
    process.exit(1);
  }
  const iterations = Number(process.argv[3]) || 1000;
  const stats = await benchmarkDerivation({ seed, iterations });
  console.log(`Derived ${stats.iterations} keys in ${stats.durationMs.toFixed(2)} ms`);
  console.log(`Average per derivation: ${stats.avgPerIterationMs.toFixed(4)} ms`);
  console.log(`Throughput: ${stats.throughputPerSecond.toFixed(2)} ops/sec`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
