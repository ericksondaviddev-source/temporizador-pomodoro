// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMbSBJ75nSWrZiOnpb1_afMwNetmJB5Ck",
  authDomain: "mindfocus-pomodoro.firebaseapp.com",
  projectId: "mindfocus-pomodoro",
  storageBucket: "mindfocus-pomodoro.firebasestorage.app",
  messagingSenderId: "462504242971",
  appId: "1:462504242971:web:d70b756deaee4bf7666dbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Forzar selección de cuenta y evitar problemas de popup
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Exportar todo lo que necesitamos
export { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy
};
