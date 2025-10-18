// src/index.js
const subtle = (globalThis.crypto?.subtle || globalThis.crypto?.webcrypto?.subtle);
const toHex = (u8) => Array.from(u8).map(b=>b.toString(16).padStart(2,'0')).join('');

async function hkdfSha256(input, { salt='picyboo.ctx', info='CTX', length=32 } = {}) {
  if (!subtle) throw new Error('WebCrypto unavailable (need Node 18+ or browser)');
  const enc = new TextEncoder();
  const ikm = enc.encode(input);

  // Extract: PRK = HMAC(salt, IKM)
  const saltKey = await subtle.importKey('raw', enc.encode(salt), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const prkBuf  = await subtle.sign('HMAC', saltKey, ikm);
  const prkKey  = await subtle.importKey('raw', prkBuf, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);

  // Expand: T(1..n) = HMAC(PRK, T(prev) || info || counter)
  const hashLen = 32; // bytes
  const blocks  = Math.ceil(length / hashLen);
  const infoBytes = enc.encode(info);
  let t = new Uint8Array(0);
  const out = new Uint8Array(blocks * hashLen);
  let off = 0;

  for (let i = 1; i <= blocks; i++) {
    const data = new Uint8Array(t.length + infoBytes.length + 1);
    data.set(t, 0);
    data.set(infoBytes, t.length);
    data[data.length - 1] = i;
    t = new Uint8Array(await subtle.sign('HMAC', prkKey, data));
    out.set(t, off);
    off += hashLen;
  }
  return toHex(out.slice(0, length)); // 32 bytes -> 64 hex chars
}

export async function deriveCTX(seed, count = 1) {
  const n = Math.max(1, Math.min(50, Number(count) || 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(await hkdfSha256(String(seed), { salt: 'picyboo.ctx', info: `CTX:${i}`, length: 32 }));
  }
  return out;
}
