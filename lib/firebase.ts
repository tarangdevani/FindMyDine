import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace these values with your actual Firebase project configuration
// or ensure they are available in your environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyDctBo77qkrvIbIjzdlWz3wOLllXnu5Mus",
  authDomain: "findmydine-ff2ba.firebaseapp.com",
  projectId: "findmydine-ff2ba",
  storageBucket: "findmydine-ff2ba.firebasestorage.app",
  messagingSenderId: "93682242346",
  appId: "1:93682242346:web:4e2a8faa1d397b67724453",
  measurementId: "G-P3P2HV8992"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
