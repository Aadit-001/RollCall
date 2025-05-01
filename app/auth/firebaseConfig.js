import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration object (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBjs7kDhQCnvSQekRuIcb76jH3gS3yLhzU",
  authDomain: "rollcall-01.firebaseapp.com",
  projectId: "rollcall-01",
  storageBucket: "rollcall-01.firebasestorage.app",
  messagingSenderId: "943729300683",
  appId: "1:943729300683:web:744debbc28b9a33df2b74e",
  measurementId: "G-E4M4FD3PQH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistent storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
