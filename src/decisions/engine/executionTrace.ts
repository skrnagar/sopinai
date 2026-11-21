import {
  ConditionEvalTrace,
  DecisionTraceStep,
  DecisionVersionSnapshot,
} from '../types';

let executionSequence = 0;

export function nextExecutionId(prefix = 'exec'): string {
  executionSequence = (executionSequence + 1) % 100000;
  return `${prefix}-${Date.now()}-${String(executionSequence).padStart(4, '0')}`;
}

/**
 * Deterministic canonical JSON serializer: recursively sorts plain object keys
 * so equivalent specs produce byte-identical output across engines and sessions.
 */
export function canonicalSerialize(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? 'null' : canonicalSerialize(item))).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((k) => record[k] !== undefined)
      .sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalSerialize(record[k])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(val: number, bits: number): number {
  return (val >>> bits) | (val << (32 - bits));
}

/**
 * Pure TypeScript synchronous RFC 6234 SHA-256 digest over UTF-8 bytes.
 * Deterministic and identical in browser UI threads and Node.js test environments.
 */
export function sha256Hex(input: string): string {
  const utf8 = new TextEncoder().encode(input);
  const bitLen = utf8.length * 8;
  const paddedLen = Math.ceil((utf8.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLen);
  bytes.set(utf8);
  bytes[utf8.length] = 0x80;

  const view = new DataView(bytes.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(paddedLen - 8, highBits, false);
  view.setUint32(paddedLen - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((x) => x.toString(16).padStart(8, '0'))
    .join('');
}

export function computeSha256Hash(input: string): string {
  return `sha256:${sha256Hex(input)}`;
}

export function computeCanonicalSpecHash(specBody: unknown): string {
  return computeSha256Hash(canonicalSerialize(specBody));
}

/**
 * Deterministic cryptographic SHA-256 digest used for immutable version snapshots.
 */
export function computeDeterministicHash(input: string): string {
  return computeSha256Hash(input);
}

function computeLegacyFnv1a(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (c + i) & 0xff;
    h2 = Math.imul(h2, 0x01000193);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `fnv1a:${hex1}${hex2}`;
}

export function verifySnapshotIntegrity(snapshot: DecisionVersionSnapshot): {
  valid: boolean;
  reason: string;
  expectedHash?: string;
  algorithm: 'sha256' | 'fnv1a-legacy' | 'partial-seed';
} {
  if (!snapshot.serializedSpec || !snapshot.snapshotHash) {
    return {
      valid: false,
      reason: 'Snapshot missing serialized specification or hash.',
      algorithm: 'sha256',
    };
  }

  if (snapshot.snapshotHash.startsWith('sha256:') && snapshot.snapshotHash.length === 71) {
    try {
      const parsed = JSON.parse(snapshot.serializedSpec);
      const canonicalHash = computeCanonicalSpecHash(parsed);
      const rawHash = computeSha256Hash(snapshot.serializedSpec);
      const matches =
        snapshot.snapshotHash === canonicalHash || snapshot.snapshotHash === rawHash;
      return matches
        ? { valid: true, reason: 'Verified canonical SHA-256 integrity.', algorithm: 'sha256' }
        : {
            valid: false,
            reason: `SHA-256 mismatch: expected ${canonicalHash}, stored ${snapshot.snapshotHash}.`,
            expectedHash: canonicalHash,
            algorithm: 'sha256',
          };
    } catch {
      const rawHash = computeSha256Hash(snapshot.serializedSpec);
      return snapshot.snapshotHash === rawHash
        ? { valid: true, reason: 'Verified raw SHA-256 integrity.', algorithm: 'sha256' }
        : {
            valid: false,
            reason: `SHA-256 mismatch on snapshot payload.`,
            expectedHash: rawHash,
            algorithm: 'sha256',
          };
    }
  }

  if (snapshot.snapshotHash.startsWith('fnv1a:')) {
    const expected = computeLegacyFnv1a(snapshot.serializedSpec);
    return snapshot.snapshotHash === expected
      ? { valid: true, reason: 'Legacy FNV-1a snapshot verified (pre-SHA-256).', algorithm: 'fnv1a-legacy' }
      : {
          valid: false,
          reason: `Legacy FNV-1a checksum mismatch (expected ${expected}).`,
          expectedHash: expected,
          algorithm: 'fnv1a-legacy',
        };
  }

  return {
    valid: true,
    reason: 'Historical summary seed record (abbreviated metadata only).',
    algorithm: 'partial-seed',
  };
}

export function buildInputSummary(input: Record<string, unknown>): Record<string, string> {
  const summary: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) summary[k] = 'undefined';
    else if (v === null) summary[k] = 'null';
    else if (typeof v === 'object') summary[k] = JSON.stringify(v);
    else summary[k] = String(v);
  }
  return summary;
}

export function buildConditionTraceSteps(
  conditions: ConditionEvalTrace[],
  phase: DecisionTraceStep['phase'] = 'condition',
  startIndex = 1
): DecisionTraceStep[] {
  return conditions.map((c, idx) => ({
    stepIndex: startIndex + idx,
    phase,
    label: c.label,
    detail:
      c.explanation ||
      `${c.label} (${c.expectedSpec}) -> actual=${c.actualValue} => ${c.passed ? 'TRUE' : 'FALSE'}`,
    passed: c.passed,
  }));
}
