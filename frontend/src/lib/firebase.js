import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const userRef = doc(db, "users", fbUser.uid);
  const snap    = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: fbUser.uid, name: fbUser.displayName,
      email: fbUser.email, avatar: fbUser.photoURL,
      provider: "google", createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(), history: [],
    });
  } else {
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
  }
  const userDoc = (await getDoc(userRef)).data();
  return { ...userDoc, uid: fbUser.uid };
}

export async function logOut() { await signOut(auth); }

export function onUserChange(callback) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) { callback(null); return; }
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    callback(snap.exists() ? { ...snap.data(), uid: fbUser.uid } : null);
  });
}

export async function saveHistoryEntry(uid, type, data) {
  const { collection, addDoc } = await import("firebase/firestore");
  await addDoc(collection(db, "users", uid, "history"), {
    type, ...data, createdAt: serverTimestamp(),
  });
}

export async function getHistory(uid) {
  const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
  const q = query(collection(db, "users", uid, "history"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}