import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../utils/nativeAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const auth0Middleware = (process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE) ? auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
}) : null;

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    // 1. Try DevSup Native JWT Verification
    const nativePayload = verifyToken(token);
    if (nativePayload) {
      req.auth = {
        payload: {
          sub: nativePayload.sub,
          email: nativePayload.email,
          name: nativePayload.displayName || nativePayload.name,
          username: nativePayload.username
        }
      };
      return next();
    }
  }

  // 2. Fall back to Auth0 validation for social logins (Google/GitHub)
  if (auth0Middleware) {
    return auth0Middleware(req, res, next);
  }

  return res.status(401).json({ message: 'Unauthorized. Invalid or missing token.' });
};
