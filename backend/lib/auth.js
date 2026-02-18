import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
// NOTE: `better-auth` and its mongo adapter are used according to the project's constraints.
// These package names are placeholders for the Better Auth library and adapter. Install them in backend/package.json.
import BetterAuth from 'better-auth';
import BetterAuthMongoAdapter from 'better-auth-mongo-adapter';

// Adapter configuration using existing mongoose connection
const adapter = new BetterAuthMongoAdapter({ mongooseConnection: mongoose.connection });

// Create auth instance with sensible defaults
const auth = new BetterAuth({
  adapter,
  session: {
    cookieName: process.env.BA_COOKIE_NAME || 'ba_session',
    // 7 days
    ttl: (parseInt(process.env.BA_SESSION_TTL || '604800', 10)),
    secure: process.env.NODE_ENV === 'production'
  }
});

export { auth };
