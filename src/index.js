export async function deriveCTX(seed, count=1){
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(seed), 'HKDF', false, ['deriveKey']);
  const out=[];
  for(let i=0;i<count;i++){
    const k = await crypto.subtle.deriveKey(
      {name:'HKDF', hash:'SHA-256', salt:enc.encode('picyboo.ctx'), info:enc.encode(String(i))},
      baseKey, {name:'AES-GCM', length:256}, true, ['exportKey']
    );
    const raw = await crypto.subtle.exportKey('raw', k);
    out.push(Buffer.from(raw).toString('hex'));
  }
  return out;
}
