import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'mm_session'
const SESSION_DAYS = 30
const MAX_CLOCK_SKEW_MS = 30000

function secret() {
  const value = process.env.AUTH_SECRET || process.env.DATABASE_URL
  if (!value) throw new Error('AUTH_SECRET is not configured')
  return createHash('sha256').update(value).digest()
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return salt + ':' + hash
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const actual = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

export async function createSession(userId: string, organizationId: string) {
  const expiresAt = Date.now() + SESSION_DAYS * 86400000
  const payload = userId + '.' + organizationId + '.' + expiresAt
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  const store = cookies()
  store.set(SESSION_COOKIE, payload + '.' + signature, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  })
}

export function getSession() {
  const store = cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [userId, organizationId, expiresAt, signature] = parts
  const expires = Number(expiresAt)
  if (!Number.isFinite(expires) || expires < Date.now() || expires > Date.now() + SESSION_DAYS * 86400000 + MAX_CLOCK_SKEW_MS) return null
  const payload = userId + '.' + organizationId + '.' + expiresAt
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  return { userId, organizationId }
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE)
}
