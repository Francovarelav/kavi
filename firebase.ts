// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA1NWvn2zBdmJ0naZBmUL4elRxxNLuh9d0",
  authDomain: "kaviai.firebaseapp.com",
  projectId: "kaviai",
  storageBucket: "kaviai.firebasestorage.app",
  messagingSenderId: "784714733376",
  appId: "1:784714733376:web:b0c04ca4b58384e82a0ca5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Bind to bucket explicitly to avoid misrouting
export const storage = getStorage(app);
export default app;