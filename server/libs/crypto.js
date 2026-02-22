import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const saltLength = 16;
const pepper = 'server-only-secret-pepper_value_12345_!@#$%';

const pbkdf2Iterations = 200000;
const keyLength = 32;
const digest = 'sha512';

const encode = (buf) => buf.toString('hex');
const decode = (str) => Buffer.from(str, 'hex');

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export const encryptAES = (plaintext, secret) => {
  const iv = crypto.randomBytes(ivLength);
  const salt = crypto.randomBytes(saltLength);
  const timestamp = Date.now();

  const combinedSecret = secret + pepper;

  const key = crypto.pbkdf2Sync(combinedSecret, salt, pbkdf2Iterations, keyLength, digest);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  cipher.setAAD(Buffer.from(timestamp.toString()));

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  const hmac = crypto.createHmac('sha512', key)
    .update(salt)
    .update(iv)
    .update(authTag)
    .update(Buffer.from(encrypted, 'hex'))
    .update(Buffer.from(timestamp.toString()))
    .digest();

  const token = [
    encode(salt),
    encode(iv),
    encode(authTag),
    encrypted,
    timestamp.toString(16),
    hmac.toString('hex'),
  ].join(':');

  return token;
};

export const decryptAES = (token, secret, maxAgeMs = 0) => {
  const parts = token.split(':');
  if (parts.length !== 6) throw new Error('Invalid encrypted data format');

  const [saltHex, ivHex, authTagHex, encryptedHex, timestampHex, hmacHex] = parts;

  const salt = decode(saltHex);
  const iv = decode(ivHex);
  const authTag = decode(authTagHex);
  const encrypted = encryptedHex;
  const timestamp = parseInt(timestampHex, 16);
  const hmac = decode(hmacHex);

  if (maxAgeMs > 0) {
    const age = Date.now() - timestamp;
    if (age > maxAgeMs) throw new Error('Token expired');
  }

  const combinedSecret = secret + pepper;
  const key = crypto.pbkdf2Sync(combinedSecret, salt, pbkdf2Iterations, keyLength, digest);

  const hmacVerify = crypto.createHmac('sha512', key)
    .update(salt)
    .update(iv)
    .update(authTag)
    .update(Buffer.from(encrypted, 'hex'))
    .update(Buffer.from(timestamp.toString()))
    .digest();

  if (!constantTimeEqual(hmacVerify, hmac)) {
    throw new Error('HMAC verification failed');
  }

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAAD(Buffer.from(timestamp.toString()));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};