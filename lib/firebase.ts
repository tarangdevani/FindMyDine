
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export default firebase;
