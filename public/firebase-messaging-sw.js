importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDlHxqxQ-5c6qPncSq6Tn2mmxT3F8pYqN8",
  authDomain: "hrishi-notify.firebaseapp.com",
  projectId: "hrishi-notify",
  messagingSenderId: "214762775434",
  appId: "1:214762775434:web:79ad24b1a22cff275b5e73"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png"
  });
});
