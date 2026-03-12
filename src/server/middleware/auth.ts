import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthUser } from '../types';

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS env var)
if (!admin.apps.length) {
  admin.initializeApp({
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
