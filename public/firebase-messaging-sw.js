importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// We need to initialize firebase in the SW with the public config.
// Ideally, the config should be injected, but we can safely hardcode the public project ID here
// since it's meant to be public, or we can fetch it. For now, we'll try to fetch it if possible,
// or wait for the client to register it. Actually, standard practice is to hardcode public config.
// Since we don't have it explicitly right now, we can use a dummy or standard initialization that requires it.

const firebaseConfig = {
  apiKey: "AIzaSyBiceHC3KNNDpNhRQGBzLH8qmxwd7os-VQ",
  authDomain: "vsmresult.firebaseapp.com",
  projectId: "vsmresult",
  storageBucket: "vsmresult.firebasestorage.app",
  messagingSenderId: "457742819807",
  appId: "1:457742819807:web:45ba0659fa40490c86646a"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();



self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const options = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/icon-192x192.png',
        data: payload.data
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Error parsing push payload", e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
