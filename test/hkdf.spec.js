import assert from "node:assert/strict";
import { deriveCTX } from "../src/index.js";

// RFC5869-konsistenter Check (nicht 1:1 RFC-Vektor, aber deterministisch)
const seed = "test-seed";
const expectLen = 64; // hex
const hexRe = /^[0-9a-f]{64}$/i;

const main = async () => {
  const keys = await deriveCTX(seed, 3);
  assert.equal(keys.length, 3);
  keys.forEach(k => assert.match(k, hexRe));
  assert.notEqual(keys[0], keys[1]); // info=CTX:0 vs CTX:1
  console.log("hkdf.spec: OK");
};
main().catch(e => { console.error(e); process.exit(1); });
