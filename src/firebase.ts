import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbWRnE1mtoeDcfptxvYe0a2NNe1t-qeXo",
  authDomain: "vibrant-cursor-csjh2.firebaseapp.com",
  projectId: "vibrant-cursor-csjh2",
  storageBucket: "vibrant-cursor-csjh2.firebasestorage.app",
  messagingSenderId: "857642537229",
  appId: "1:857642537229:web:fdb9c5e554be6000dc2044"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom databaseId provided in config
export const db = getFirestore(app, "ai-studio-3f35dba3-e553-433c-a1a0-f0f527485f8a");
