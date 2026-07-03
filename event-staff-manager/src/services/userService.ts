import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
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

  const allUsers = await getDocs(collection(db, 'users'));
  const role: UserRole = allUsers.empty ? 'super-admin' : 'day-manager';

  const newUser: Omit<AppUser, 'uid'> = {
    email,
    displayName,
    role,
    createdAt: Date.now(),
  };

  await setDoc(userRef, newUser);
  await logAudit('CREATE', 'user', uid, uid, email, `Usuario registrado como ${role}`);
  return { uid, ...newUser };
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
