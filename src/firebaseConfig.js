import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBj1gMkZ3WcZf6mJsvRgqwHksS0M_XJ9o8",
  authDomain: "nirikshan-325c2.firebaseapp.com",
  projectId: "nirikshan-325c2",
  storageBucket: "nirikshan-325c2.firebasestorage.app",
  messagingSenderId: "48463970094",
  appId: "1:48463970094:web:14e9e730f17b90afeec4bf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);