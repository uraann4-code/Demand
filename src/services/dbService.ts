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
    
    items.forEach(item => {
      if (item.description) {
        const prodId = `prod_${btoa(item.description.trim()).replace(/=/g, '')}`;
        batch.set(doc(db, suggestionsPath, prodId), {
          type: 'product',
          value: item.description.trim(),
          lastUsed: serverTimestamp()
        }, { merge: true });
      }
      
      if (item.justification) {
        const justId = `just_${btoa(item.justification.trim()).replace(/=/g, '')}`;
        batch.set(doc(db, suggestionsPath, justId), {
          type: 'justification',
          value: item.justification.trim(),
          lastUsed: serverTimestamp()
        }, { merge: true });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_save');
  }
};
