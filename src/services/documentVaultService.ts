// src/services/documentVaultService.ts
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  addDoc,
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DocumentRecord, Provenance } from '../types';

export interface VaultCategorySummary {
  category: 'PREGNANCY' | 'CHILD' | 'IMMUNIZATION' | 'GROWTH' | 'LABS' | 'CLINICAL_NOTES';
  title: string;
  count: number;
  verifiedCount: number;
  reportedCount: number;
}

export async function getVaultCategorySummaries(motherId: string): Promise<VaultCategorySummary[]> {
  try {
    // Aggregation queries across all collections for this mother
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('userId', '==', motherId));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data() as DocumentRecord);

    const categories: { [key: string]: { total: number; verified: number; reported: number } } = {
      PREGNANCY: { total: 0, verified: 0, reported: 0 },
      CHILD: { total: 0, verified: 0, reported: 0 },
      IMMUNIZATION: { total: 0, verified: 0, reported: 0 },
      GROWTH: { total: 0, verified: 0, reported: 0 },
      LABS: { total: 0, verified: 0, reported: 0 },
      CLINICAL_NOTES: { total: 0, verified: 0, reported: 0 },
    };

    docs.forEach(docItem => {
      let catKey = 'CLINICAL_NOTES';
      if (docItem.category === 'Ultrasound') catKey = 'PREGNANCY';
      else if (docItem.category === 'Immunization') catKey = 'IMMUNIZATION';
      else if (docItem.category === 'Lab Results') catKey = 'LABS';
      else if (docItem.category === 'Clinical Notes') catKey = 'CLINICAL_NOTES';

      if (categories[catKey]) {
        categories[catKey].total += 1;
        if (docItem.provenance?.status === 'VERIFIED') {
          categories[catKey].verified += 1;
        } else {
          categories[catKey].reported += 1;
        }
      }
    });

    return [
      {
        category: 'PREGNANCY',
        title: 'Pregnancy & ANC Records',
        count: categories.PREGNANCY.total,
        verifiedCount: categories.PREGNANCY.verified,
        reportedCount: categories.PREGNANCY.reported,
      },
      {
        category: 'CHILD',
        title: 'Child & Newborn Records',
        count: categories.CHILD.total,
        verifiedCount: categories.CHILD.verified,
        reportedCount: categories.CHILD.reported,
      },
      {
        category: 'IMMUNIZATION',
        title: 'Immunization Passport',
        count: categories.IMMUNIZATION.total,
        verifiedCount: categories.IMMUNIZATION.verified,
        reportedCount: categories.IMMUNIZATION.reported,
      },
      {
        category: 'GROWTH',
        title: 'Growth & MUAC Logs',
        count: categories.GROWTH.total,
        verifiedCount: categories.GROWTH.verified,
        reportedCount: categories.GROWTH.reported,
      },
      {
        category: 'LABS',
        title: 'Lab & Diagnostic Tests',
        count: categories.LABS.total,
        verifiedCount: categories.LABS.verified,
        reportedCount: categories.LABS.reported,
      },
      {
        category: 'CLINICAL_NOTES',
        title: 'Clinical Encounters & Notes',
        count: categories.CLINICAL_NOTES.total,
        verifiedCount: categories.CLINICAL_NOTES.verified,
        reportedCount: categories.CLINICAL_NOTES.reported,
      },
    ];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'documents');
    return [];
  }
}

export async function addVaultDocument(docData: Omit<DocumentRecord, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, 'documents');
    const docRef = await addDoc(colRef, {
      ...docData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'documents');
    throw err;
  }
}

export async function getVaultDocumentsByCategory(
  userId: string, 
  category: string
): Promise<DocumentRecord[]> {
  try {
    const colRef = collection(db, 'documents');
    const q = query(
      colRef, 
      where('userId', '==', userId),
      where('category', '==', category)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as DocumentRecord));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'documents');
    return [];
  }
}
