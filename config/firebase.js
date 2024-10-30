import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = initializeApp({
  apiKey: "AIzaSyCpYorVngNOh7_kvwD3m0LgTehkoThpx_k",
  authDomain: "backend-laporpaksumbar.firebaseapp.com",
  projectId: "backend-laporpaksumbar",
  storageBucket: "backend-laporpaksumbar.appspot.com",
  messagingSenderId: "459603006760",
  appId: "1:459603006760:web:b088293a8dd135715c6c1d",
  measurementId: "G-QV1XWBQXS4"
});
const storage = getStorage(firebaseConfig);
export default storage;
