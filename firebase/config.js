import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNU51Nu0gLhRdwMRg6_QNrVM9Ci4yIQAQ",
  authDomain: "whatsapp-d3502.firebaseapp.com",
  databaseURL: "https://whatsapp-d3502-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whatsapp-d3502",
  storageBucket: "whatsapp-d3502.firebasestorage.app",
  messagingSenderId: "432497127304",
  appId: "1:432497127304:web:8e812582029b74cb62d43d",
  measurementId: "G-D91853P6FP"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app ;