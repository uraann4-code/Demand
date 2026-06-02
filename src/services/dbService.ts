import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { PurchaseItem, FormData } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Firestore Error:', error);
  // Based on instructions, we should throw a specific JSON string
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  throw new Error(JSON.stringify(errInfo));
}

export const getSuggestions = async (type: 'product' | 'justification', searchTerm: string) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const path = 'suggestions';
  try {
    const q = query(
      collection(db, path), 
      where('type', '==', type),
      orderBy('value'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => doc.data().value as string);
    
    // Filter client-side since Firestore doesn't support easy case-insensitive contains
    return results.filter(val => val.toLowerCase().includes(searchTerm.toLowerCase()));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveFormAndIndexItems = async (formData: FormData, items: PurchaseItem[]) => {
  const historyPath = 'history';
  const suggestionsPath = 'suggestions';
  
  try {
    // 1. Save to History
    await addDoc(collection(db, historyPath), {
      ...formData,
      items,
      createdAt: serverTimestamp()
    });

    // 2. Index Products and Justifications (Batch)
    const batch = writeBatch(db);
    
    // Helper for safe Unicode Base64
    const toBase64Safe = (str: string) => {
      try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      } catch (e) {
        return Math.random().toString(36).substring(7);
      }
    };

    items.forEach(item => {
      if (item.description && item.description.trim().length > 1) {
        const val = item.description.trim();
        const prodId = `prod_${toBase64Safe(val).slice(0, 100)}`; // Max ID length safety
        batch.set(doc(db, suggestionsPath, prodId), {
          type: 'product',
          value: val,
          lastUsed: serverTimestamp()
        }, { merge: true });
      }
      
      if (item.justification && item.justification.trim().length > 1) {
        const val = item.justification.trim();
        const justId = `just_${toBase64Safe(val).slice(0, 100)}`;
        batch.set(doc(db, suggestionsPath, justId), {
          type: 'justification',
          value: val,
          lastUsed: serverTimestamp()
        }, { merge: true });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_save');
  }
};
