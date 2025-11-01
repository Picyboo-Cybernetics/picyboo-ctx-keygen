import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function runCli(args = []) {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile('node', [resolve(projectRoot, 'bin/cli.js'), ...args], { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        rejectPromise(error);
        return;
      }
      resolvePromise({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

describe('pbctx CLI', () => {
  it('derives keys in plain text by default', async () => {
    const { stdout } = await runCli(['derive', '--seed', 'cli-seed', '--count', '2']);
    const lines = stdout.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach((line) => expect(line).toMatch(/^[0-9a-f]{64}$/));
  });

  it('supports JSON output with metadata', async () => {
    const { stdout } = await runCli(['derive', '--seed', 'cli-seed', '--count', '1', '--metadata']);
    const payload = JSON.parse(stdout);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ index: 0, info: 'CTX:0' });
  });

  it('inspects a seed and previews keys', async () => {
    const { stdout } = await runCli(['inspect', '--seed', 'cli-seed', '--count', '1']);
    expect(stdout).toMatch(/Seed OK/);
    expect(stdout).toMatch(/#0 \(CTX:0\) => [0-9a-f]{64}/);
  });
});
