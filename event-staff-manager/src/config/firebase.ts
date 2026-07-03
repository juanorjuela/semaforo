import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './env';

let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();
export { isFirebaseConfigured };
