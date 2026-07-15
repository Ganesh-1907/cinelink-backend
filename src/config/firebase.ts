import admin from 'firebase-admin';
import { env } from './env';
import path from 'path';
let firebaseApp: admin.app.App;
export function getFirebaseApp(): admin.app.App {
  if (firebaseApp) return firebaseApp;
  const saPath = env.firebaseServiceAccountPath ? path.resolve(__dirname, '../../', env.firebaseServiceAccountPath) : null;
  if (saPath) {
    try { const sa = require(saPath); firebaseApp = admin.initializeApp({ credential: admin.credential.cert(sa) }); }
    catch { firebaseApp = admin.initializeApp(); }
  } else { firebaseApp = admin.initializeApp(); }
  return firebaseApp;
}
export const firestore = () => getFirebaseApp().firestore();
export const auth = () => getFirebaseApp().auth();
export const messaging = () => getFirebaseApp().messaging();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;