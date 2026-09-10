import crypto from 'node:crypto';

export function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(String(password))
    .digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

export function createToken(user) {
  return Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  ).toString('base64url');
}