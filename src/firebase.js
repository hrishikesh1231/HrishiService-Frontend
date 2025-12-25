import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDlHxqxQ-5c6qPncSq6Tn2mmxT3F8pYqN8",
  authDomain: "hrishi-notify.firebaseapp.com",
  projectId: "hrishi-notify",
  messagingSenderId: "214762775434",
  appId: "1:214762775434:web:79ad24b1a22cff275b5e73"
};

const app = initializeApp(firebaseConfig);

// 🔔 Messaging export
export const messaging = getMessaging(app);
