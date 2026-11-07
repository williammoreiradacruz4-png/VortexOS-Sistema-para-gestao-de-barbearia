import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCjz_RsO4ryBvNHyP-WSkNIFjdmQ_S3WWk",
  authDomain: "gen-lang-client-0613172340.firebaseapp.com",
  projectId: "gen-lang-client-0613172340",
  storageBucket: "gen-lang-client-0613172340.firebasestorage.app",
  messagingSenderId: "634474236035",
  appId: "1:634474236035:web:7a374b0969a8bc1bc733b6"
};

// Initialize Firebase (singleton safe)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
