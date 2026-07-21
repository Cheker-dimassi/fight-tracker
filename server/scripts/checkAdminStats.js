import crypto from 'node:crypto';

const secret = process.env.AUTH_TOKEN_SECRET || 'dev-local-secret-please-change';
const email = 'chekerallahd@gmail.com';
const payload = JSON.stringify({ email, exp: Date.now() + 24 * 60 * 60 * 1000 });
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
const token = Buffer.from(`${payload}.${signature}`).toString('base64url');

console.log('generated token:', token);
const decoded = Buffer.from(token, 'base64url').toString('utf8');
console.log('decoded payload.signature:', decoded);
const sep = decoded.lastIndexOf('.');
console.log('sep index:', sep);
const payloadPart = decoded.slice(0, sep);
const sigPart = decoded.slice(sep + 1);
const expected = crypto.createHmac('sha256', secret).update(payloadPart).digest('hex');
console.log('sigPart length:', sigPart.length, 'expected length:', expected.length);
console.log('sig equal?:', sigPart === expected);

const urls = ['http://localhost:8082/api/auth/me', 'http://localhost:8082/api/admin/stats'];

(async () => {
  try {
    for (const url of urls) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      console.log('URL:', url);
      console.log('Status:', res.status);
      try {
        console.log(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        console.log(text);
      }
      console.log('---');
    }
  } catch (e) {
    console.error('error', e.message);
    process.exit(1);
  }
})();
