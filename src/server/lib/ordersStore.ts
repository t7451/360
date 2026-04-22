import { ordersCollection } from './db';
import admin from 'firebase-admin';
import { Order } from '../types';

export async function createOrder(order: Order): Promise<void> {
  await ordersCollection().doc(order.id).set({
    ...order,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  const doc = await ordersCollection().doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
  } as Order;
}

export async function listOrdersByUser(uid: string): Promise<Order[]> {
  const snap = await ordersCollection()
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snap.docs.map(d => {
    const data = d.data();
    return { ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt } as Order;
  });
}

export async function updateOrderStatus(id: string, status: string, extra?: Partial<Order>): Promise<void> {
  await ordersCollection().doc(id).update({
    status,
    ...extra,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  await ordersCollection().doc(id).delete();
}
