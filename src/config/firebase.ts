import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZ9YbH_KV_3q9Z7Y9Z7Y9Z7Y9Z7Y9Z7Y9",
  authDomain: "semaforo-de-igualdad.firebaseapp.com",
  projectId: "semaforo-de-igualdad",
  storageBucket: "semaforo-de-igualdad.appspot.com",
  messagingSenderId: "408879492484",
  appId: "1:408879492484:web:1q2w3e4r5t6y7u8i9o0p"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize with sample cards if needed
export const initializeSampleCards = async () => {
  const sampleCards = [
    {
      question: "¿Qué significa la igualdad de género?",
      answer: "Derechos y oportunidades iguales para todos",
      color: "red"
    },
    {
      question: "¿Qué es la discriminación?",
      answer: "Trato injusto basado en prejuicios",
      color: "red"
    },
    {
      question: "¿Qué son los derechos humanos?",
      answer: "Garantías fundamentales para todas las personas",
      color: "red"
    },
    {
      question: "¿Cómo podemos promover la igualdad en el trabajo?",
      answer: "Oportunidades y salarios equitativos",
      color: "yellow"
    },
    {
      question: "¿Qué es el empoderamiento?",
      answer: "Proceso de ganar control sobre decisiones",
      color: "yellow"
    },
    {
      question: "¿Cómo podemos crear una sociedad más inclusiva?",
      answer: "Educación y políticas equitativas",
      color: "green"
    }
  ];

  try {
    const cardsCollection = collection(db, 'cards');
    for (const card of sampleCards) {
      await addDoc(cardsCollection, card);
    }
    console.log('Sample cards added successfully');
  } catch (error) {
    console.error('Error adding sample cards:', error);
  }
}; 