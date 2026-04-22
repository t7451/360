import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthUser } from '../types';

// Initialize Firebase Admin once.
// Credential resolution order:
//   1. GOOGLE_APPLICATION_CREDENTIALS (file path) — set by index.ts from GOOGLE_APPLICATION_CREDENTIALS_JSON
//   2. Application Default Credentials (local dev / GCP environments)
if (!admin.apps.length) {
  const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : admin.credential.applicationDefault();

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    // Extract custom claims for RBAC
    const role = (decoded.role as AuthUser['role']) || 'client';

    (req as any).user = {
      uid: decoded.uid,
      email: decoded.email || '',
      role,
    } satisfies AuthUser;

    next();
  } catch (err: any) {
    console.error('[Auth] Token verification failed:', err.message);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
