import admin from 'firebase-admin';

// Call after Firebase Admin is initialized (it is, in auth.ts which runs first)
export function ordersCollection() {
  if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
  return admin.firestore().collection('orders');
}
