import { benchmarkDerivation, deriveCtxBatch } from '../src/index.js';

async function main() {
  const seed = process.argv[2] ?? 'investor-preview@example.com';
  const rotation = await deriveCtxBatch({ seed, count: 4, includeMetadata: true, encoding: 'base64' });

  console.log('CTX rotation set for seed:', seed);
  rotation.forEach((entry) => {
    console.log(`- [${entry.info}] (${entry.encoding}) => ${entry.key}`);
  });

  const metrics = await benchmarkDerivation({ seed, iterations: 200 });
  console.log('\nBenchmark metrics:');
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
