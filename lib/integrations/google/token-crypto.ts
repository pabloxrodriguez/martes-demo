import "server-only";

import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getEncryptionKey() {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("Falta GOOGLE_TOKEN_ENCRYPTION_KEY.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptGoogleToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    algorithm,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptGoogleToken(payload: string) {
  const [ivValue, authTagValue, encryptedValue] = payload.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("El token cifrado de Google no tiene un formato válido.");
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
