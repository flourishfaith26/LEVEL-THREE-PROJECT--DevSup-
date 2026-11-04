import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'devsup_native_auth_secret_key_prod_2026_secure';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

export function verifyPassword(password, storedHash, storedSalt) {
    try {
        const hash = crypto.scryptSync(password, storedSalt, 64).toString('hex');
        const hashBuffer = Buffer.from(hash, 'hex');
        const storedBuffer = Buffer.from(storedHash, 'hex');
        if (hashBuffer.length !== storedBuffer.length) return false;
        return crypto.timingSafeEqual(hashBuffer, storedBuffer);
    } catch {
        return false;
    }
}

function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
}

export function generateToken(payload) {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
        iss: 'devsup-native'
    };
    const now = Math.floor(Date.now() / 1000);
    const body = {
        ...payload,
        iat: now,
        exp: now + TOKEN_EXPIRY_SECONDS
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const dataToSign = `${encodedHeader}.${encodedBody}`;

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(dataToSign)
        .digest();
    const encodedSignature = base64UrlEncode(signature);

    return `${dataToSign}.${encodedSignature}`;
}

export function verifyToken(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedBody, encodedSignature] = parts;
        const header = JSON.parse(base64UrlDecode(encodedHeader));
        if (header.alg !== 'HS256') return null;

        const dataToSign = `${encodedHeader}.${encodedBody}`;
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(dataToSign)
            .digest();
        const actualSignature = Buffer.from(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

        if (expectedSignature.length !== actualSignature.length) return null;
        if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) return null;

        const body = JSON.parse(base64UrlDecode(encodedBody));
        const now = Math.floor(Date.now() / 1000);
        if (body.exp && body.exp < now) {
            return null; // Expired
        }

        return body;
    } catch {
        return null;
    }
}
