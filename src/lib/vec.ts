// Float32 BLOB <-> number[] helpers for SQLite vector columns.

export function vecToBlob(v: number[]): Buffer {
  const f = new Float32Array(v);
  return Buffer.from(f.buffer, f.byteOffset, f.byteLength);
}

export function blobToVec(b: Buffer): number[] {
  const f = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
  return Array.from(f);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

export function detectLang(text: string): 'hi' | 'en' {
  // Devanagari range
  const hi = /[ऀ-ॿ]/.test(text);
  return hi ? 'hi' : 'en';
}
