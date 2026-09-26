import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';

dotenv.config();


export const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});