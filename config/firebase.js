import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = initializeApp({
  apiKey: "AIzaSyAc_vgbbR5iQoIzXkVX6WpxiMGvh1eoDxY",
  authDomain: "be-lapor-pak.firebaseapp.com",
  projectId: "be-lapor-pak",
  storageBucket: "be-lapor-pak.appspot.com",
  messagingSenderId: "585516009338",
  appId: "1:585516009338:web:e49d2a1ddfd6671be678c3",
  measurementId: "G-2HVCWGSLHZ",
});
const storage = getStorage(firebaseConfig);
export default storage;
