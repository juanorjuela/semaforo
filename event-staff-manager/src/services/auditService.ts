import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditLogEntry } from '../types';

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  userEmail: string,
  details: string
): Promise<void> {
  await addDoc(collection(db, 'auditLogs'), {
    action,
    entityType,
    entityId,
    userId,
    userEmail,
    details,
    timestamp: Date.now(),
  });
}

export async function getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limit)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as AuditLogEntry[];
}
