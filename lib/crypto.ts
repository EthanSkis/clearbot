import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";

// Envelope encryption for portal credentials.
//   Each row carries its own AES-256 DEK (data encryption key).
//   The DEK is encrypted under a master key (KEK) held in env.
//   To swap in real KMS later, replace wrapDek/unwrapDek to call the KMS.

const MASTER_KEY_ID = "env-v1";

function masterKey(): Buffer {
  const raw = process.env.CREDENTIAL_MASTER_KEY;
  if (!raw) throw new Error("CREDENTIAL_MASTER_KEY missing");
  // Accept either hex (64 chars) or base64 (44 chars). Always 32 bytes.
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) key = Buffer.from(raw, "hex");
  else key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("CREDENTIAL_MASTER_KEY must decode to 32 bytes (AES-256)");
  return key;
}

export type EnvelopePayload = {
  encrypted_dek: string;
  encrypted_data: string;
  iv: string;
  auth_tag: string;
  master_key_id: string;
};

function aesGcmEncrypt(key: Buffer, plaintext: Buffer): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
}

function aesGcmDecrypt(key: Buffer, ciphertext: Buffer, iv: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function wrapDek(dek: Buffer): { encrypted_dek: string } {
  // For the env-key strategy we just AES-GCM-wrap the DEK with the master
  // key. The IV and tag are prepended/appended inside the wrapped blob so
  // the row only needs to store one column for the wrapped DEK.
  const { ciphertext, iv, tag } = aesGcmEncrypt(masterKey(), dek);
  return { encrypted_dek: `${iv.toString("base64")}.${tag.toString("base64")}.${ciphertext.toString("base64")}` };
}

function unwrapDek(encryptedDek: string): Buffer {
  const [ivB64, tagB64, ctB64] = encryptedDek.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("malformed encrypted_dek");
  return aesGcmDecrypt(
    masterKey(),
    Buffer.from(ctB64, "base64"),
    Buffer.from(ivB64, "base64"),
    Buffer.from(tagB64, "base64")
  );
}

export function sealJson(value: unknown): EnvelopePayload {
  const dek = randomBytes(32);
  const { ciphertext, iv, tag } = aesGcmEncrypt(dek, Buffer.from(JSON.stringify(value), "utf8"));
  const wrapped = wrapDek(dek);
  return {
    encrypted_dek: wrapped.encrypted_dek,
    encrypted_data: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    auth_tag: tag.toString("base64"),
    master_key_id: MASTER_KEY_ID,
  };
}

export function openJson<T = unknown>(payload: EnvelopePayload): T {
  if (payload.master_key_id !== MASTER_KEY_ID) {
    throw new Error(`unsupported master_key_id: ${payload.master_key_id}`);
  }
  const dek = unwrapDek(payload.encrypted_dek);
  const plaintext = aesGcmDecrypt(
    dek,
    Buffer.from(payload.encrypted_data, "base64"),
    Buffer.from(payload.iv, "base64"),
    Buffer.from(payload.auth_tag, "base64")
  );
  return JSON.parse(plaintext.toString("utf8")) as T;
}

// HMAC for webhook signing. Keyed-hash so the signing_secret never leaves
// the server; receivers verify with the same secret.
export function hmacSha256(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// API key hashing — short prefix shown to user, full key hashed at rest.
export function newApiKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = randomBytes(24).toString("base64url"); // 32 chars
  const plaintext = `cb_${raw}`;
  const prefix = plaintext.slice(0, 10); // "cb_xxxxxxx"
  const hash = createHmac("sha256", masterKey()).update(plaintext).digest("hex");
  return { plaintext, prefix, hash };
}

export function hashApiKey(plaintext: string): string {
  return createHmac("sha256", masterKey()).update(plaintext).digest("hex");
}
