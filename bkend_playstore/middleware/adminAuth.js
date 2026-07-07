import crypto from 'crypto';

const SESSION_COOKIE = 'pixhook_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const loginAttempts = new Map();

function getAdminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_KEY;
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};

  try {
    return Object.fromEntries(
      header.split(';').map((cookie) => {
        const [name, ...value] = cookie.trim().split('=');
        return [name, decodeURIComponent(value.join('='))];
      })
    );
  } catch {
    return {};
  }
}

function sign(value) {
  const secret = getAdminSecret();
  if (!secret) return null;

  return crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64url');
}

function constantTimeEqual(a = '', b = '') {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function createSessionValue() {
  const payload = JSON.stringify({
    nonce: crypto.randomBytes(24).toString('base64url'),
    exp: Date.now() + SESSION_TTL_MS
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySession(value) {
  if (!value || !value.includes('.')) return false;

  const [encodedPayload, signature] = value.split('.');
  const expectedSignature = sign(encodedPayload);
  if (!expectedSignature || !constantTimeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return Number(payload.exp) > Date.now();
  } catch {
    return false;
  }
}

function cookieOptions(req, maxAgeMs) {
  const secure = process.env.NODE_ENV === 'production' || req.secure || req.get('x-forwarded-proto') === 'https';

  return [
    `Path=/admin`,
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };

  if (entry.resetAt < now) {
    loginAttempts.set(ip, { count: 0, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  return entry.count >= 8;
}

function registerFailedLogin(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  entry.count += 1;
  entry.resetAt = entry.resetAt < now ? now + 15 * 60 * 1000 : entry.resetAt;
  loginAttempts.set(ip, entry);
}

function clearFailedLogins(req) {
  loginAttempts.delete(clientIp(req));
}

export function requireAdmin(req, res, next) {
  const cookies = parseCookies(req);

  if (verifySession(cookies[SESSION_COOKIE])) {
    return next();
  }

  const accept = req.get('accept') || '';
  if (req.method === 'GET' && accept.includes('text/html')) {
    return res.redirect('/admin/login');
  }

  return res.status(401).json({ error: 'unauthorized' });
}

export function requireAdminOrKey(req, res, next) {
  const cookies = parseCookies(req);
  if (verifySession(cookies[SESSION_COOKIE])) {
    return next();
  }

  const configuredKey = process.env.ADMIN_KEY;
  const providedKey = req.header('x-admin-key');
  if (configuredKey && providedKey && constantTimeEqual(providedKey, configuredKey)) {
    return next();
  }

  return res.status(401).json({ error: 'unauthorized' });
}

export function loginAdmin(req, res) {
  const password = getAdminPassword();
  const secret = getAdminSecret();

  if (!password || !secret) {
    return res.status(503).json({ error: 'admin authentication is not configured' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'too many login attempts' });
  }

  const providedPassword = String(req.body?.password || '');
  if (!constantTimeEqual(providedPassword, password)) {
    registerFailedLogin(req);
    return res.status(401).json({ error: 'invalid credentials' });
  }

  clearFailedLogins(req);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(createSessionValue())}; ${cookieOptions(req, SESSION_TTL_MS)}`);
  return res.json({ ok: true });
}

export function logoutAdmin(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(req, 0)}`);
  return res.json({ ok: true });
}
