import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './env';

let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  db = getFirestore(app);
}

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();
export { isFirebaseConfigured };
