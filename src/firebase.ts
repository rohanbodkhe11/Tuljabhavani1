import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyByNdA-0jv2LxL2X0Ph-JmFf0xftwu7f2o",
  authDomain: "studio-6801998602-216b3.firebaseapp.com",
  projectId: "studio-6801998602-216b3",
  storageBucket: "studio-6801998602-216b3.firebasestorage.app",
  messagingSenderId: "606768590571",
  appId: "1:606768590571:web:b1d3abf5e7fcf7cd0ed8ae"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
