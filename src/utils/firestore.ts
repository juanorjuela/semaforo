import { DocumentData } from 'firebase/firestore';

/** Firestore rejects documents that contain `undefined` field values. */
export function toFirestoreData(data: Record<string, unknown>): DocumentData {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}
