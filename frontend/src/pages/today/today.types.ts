export interface SavedMemory {
  text: string;
  image: string | null;
}

// Données retournées par l'API pour un "past memory".
// Le backend décide quel souvenir surfacer ET renvoie un label prêt à afficher.
// La logique "1 an > 1 mois > 1 semaine > veille" est côté serveur.
export interface PastMemory {
  date: string;  // ex: "MARCH 30, 2025"
  text: string;
  label: string; // ex: "One year ago today", "One month ago today", "Yesterday"
  mood: string;  // généré par l'IA côté backend, ex: "Peaceful", "Joyful", "Anxious"
}
