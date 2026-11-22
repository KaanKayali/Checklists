// Copy the Firebase web app configuration from Firebase Console into this object.
export const firebaseConfig = {
  apiKey: "AIzaSyBS7tUGKuJr44b5errMG5ZZouL_lcXxyKE",
  authDomain: "checklists-32f74.firebaseapp.com",
  projectId: "checklists-32f74",
  storageBucket: "checklists-32f74.firebasestorage.app",
  messagingSenderId: "631604208528",
  appId: "1:631604208528:web:2aaadf0e9a7ee1fa89c915"
};  

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith('PASTE_') &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith('PASTE_') &&
    firebaseConfig.appId &&
    !firebaseConfig.appId.startsWith('PASTE_')
  );
}
