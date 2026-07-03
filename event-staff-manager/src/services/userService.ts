import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  runTransaction,
  collection,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppUser, UserRole } from '../types';
import { logAudit } from './auditService';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName: string
): Promise<AppUser> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as AppUser;
  }

  const bootstrapRef = doc(db, 'meta', 'bootstrap');
  let role: UserRole = 'day-manager';

  await runTransaction(db, async (transaction) => {
    const bootstrapSnap = await transaction.get(bootstrapRef);
    const isFirstUser = !bootstrapSnap.exists();
    role = isFirstUser ? 'super-admin' : 'day-manager';

    if (isFirstUser) {
      transaction.set(bootstrapRef, {
        initialized: true,
        createdAt: Date.now(),
      });
    }

    transaction.set(userRef, {
      email,
      displayName,
      role,
      createdAt: Date.now(),
    });
  });

  await logAudit('CREATE', 'user', uid, uid, email, `Usuario registrado como ${role}`);
  return { uid, email, displayName, role, createdAt: Date.now() };
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() })) as AppUser[];
}

export async function updateUserRole(
  uid: string,
  role: UserRole,
  actorUid: string,
  actorEmail: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
  await logAudit('UPDATE', 'user', uid, actorUid, actorEmail, `Rol cambiado a ${role}`);
}
