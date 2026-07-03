import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { StaffMember } from '../types';
import { logAudit } from './auditService';
import { toFirestoreData } from '../utils/firestore';

export async function getActiveStaff(): Promise<StaffMember[]> {
  const q = query(
    collection(db, 'staff'),
    where('archived', '==', false),
    orderBy('name')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StaffMember[];
}

export async function getAllStaff(): Promise<StaffMember[]> {
  const q = query(collection(db, 'staff'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StaffMember[];
}

export async function createStaff(
  data: Omit<StaffMember, 'id' | 'archived' | 'createdAt' | 'updatedAt'>,
  userId: string,
  userEmail: string
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(
    collection(db, 'staff'),
    toFirestoreData({
      ...data,
      archived: false,
      createdAt: now,
      updatedAt: now,
    })
  );
  try {
    await logAudit('CREATE', 'staff', docRef.id, userId, userEmail, `Personal creado: ${data.name}`);
  } catch (err) {
    console.warn('Audit log failed after staff create:', err);
  }
  return docRef.id;
}

export async function updateStaff(
  id: string,
  data: Partial<StaffMember>,
  userId: string,
  userEmail: string
): Promise<void> {
  await updateDoc(
    doc(db, 'staff', id),
    toFirestoreData({ ...data, updatedAt: Date.now() })
  );
  try {
    await logAudit('UPDATE', 'staff', id, userId, userEmail, `Personal actualizado: ${data.name || id}`);
  } catch (err) {
    console.warn('Audit log failed after staff update:', err);
  }
}

export async function archiveStaff(
  id: string,
  name: string,
  userId: string,
  userEmail: string
): Promise<void> {
  await updateDoc(doc(db, 'staff', id), { archived: true, updatedAt: Date.now() });
  await logAudit('ARCHIVE', 'staff', id, userId, userEmail, `Personal archivado: ${name}`);
}

export async function getStaffMap(): Promise<Map<string, StaffMember>> {
  const staff = await getAllStaff();
  return new Map(staff.map((s) => [s.id, s]));
}
