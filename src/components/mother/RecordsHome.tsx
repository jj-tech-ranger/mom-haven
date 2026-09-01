import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Heart, Baby, Syringe, Scale, ChevronRight, FileText } from 'lucide-react';
import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import EmptyState from '../EmptyState';

type CategoryKey = 'pregnancy' | 'child' | 'immunization' | 'growth';
type CategoryData = { count: number; verified: number };
type Categories = Record<CategoryKey, CategoryData | null> | null;

interface RecordsHomeProps {
  pregnancyCount?: number;
  pregnancyVerified?: number;
  childCount?: number;
  childVerified?: number;
  immunizationCount?: number;
  immunizationVerified?: number;
  growthCount?: number;
  growthVerified?: number;
  onOpenPregnancyRecords: () => void;
  onOpenChildRecords: () => void;
  onOpenImmunizationRecords: () => void;
  onOpenGrowthRecords: () => void;
  onOpenExportManager: () => void;
}

const CATEGORY_ICONS = { pregnancy: Heart, child: Baby, immunization: Syringe, growth: Scale };
const CATEGORY_LABELS: Record<CategoryKey, string> = { pregnancy: 'Pregnancy', child: 'Child health', immunization: 'Immunizations', growth: 'Growth' };

export const RecordsHome: React.FC<RecordsHomeProps> = ({ onOpenPregnancyRecords, onOpenChildRecords, onOpenImmunizationRecords, onOpenGrowthRecords }) => {
  const [categories, setCategories] = useState<Categories>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setCategories({ pregnancy: { count: 0, verified: 0 }, child: { count: 0, verified: 0 }, immunization: { count: 0, verified: 0 }, growth: { count: 0, verified: 0 } });
      return;
    }
    const state: Record<CategoryKey, CategoryData | null> = { pregnancy: null, child: null, immunization: null, growth: null };
    setCategories({ ...state });
    const setCategory = (key: CategoryKey, docs: Array<{ provenance?: { status?: string } }>) => {
      state[key] = { count: docs.length, verified: docs.filter((d) => d.provenance?.status === 'VERIFIED').length };
      setCategories({ ...state });
    };
    const pregnancyUnsub = onSnapshot(query(collection(db, 'pregnancies'), where('motherId', '==', userId)), (snapshot) => setCategory('pregnancy', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } })), () => setCategory('pregnancy', []));
    const childIds = new Set<string>();
    const childUnsub = onSnapshot(query(collection(db, 'children'), where('motherId', '==', userId)), (snapshot) => { childIds.clear(); snapshot.docs.forEach((d) => childIds.add(d.id)); setCategory('child', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } })); }, () => setCategory('child', []));
    const immunizationUnsub = onSnapshot(collectionGroup(db, 'immunizationRecords'), (snapshot) => setCategory('immunization', snapshot.docs.filter((d) => childIds.has(d.ref.parent.parent?.id || '')).map((d) => d.data() as { provenance?: { status?: string } })), () => setCategory('immunization', []));
    const growthUnsub = onSnapshot(collectionGroup(db, 'growthMeasurements'), (snapshot) => setCategory('growth', snapshot.docs.filter((d) => childIds.has(d.ref.parent.parent?.id || '')).map((d) => d.data() as { provenance?: { status?: string } })), () => setCategory('growth', []));
    return () => { pregnancyUnsub(); childUnsub(); immunizationUnsub(); growthUnsub(); };
  }, [userId]);

  const hasAnyRecords = useMemo(() => categories !== null && Object.values(categories).some((c) => c && c.count > 0), [categories]);
  const openCategory: Record<CategoryKey, () => void> = { pregnancy: onOpenPregnancyRecords, child: onOpenChildRecords, immunization: onOpenImmunizationRecords, growth: onOpenGrowthRecords };

  return (
    <div className="px-5 pb-24">
      <header className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-surface text-brand-primary"><Shield className="h-5 w-5" /></div>
        <div><p className="font-consumer text-xl font-bold text-text-primary">Health records</p><p className="font-clinical text-xs text-text-muted">Your recorded maternal and child health information.</p></div>
      </header>
      {categories === null ? (
        <div className="space-y-3" aria-label="Loading records">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[72px] rounded-xl border border-border-light bg-white animate-pulse" />)}</div>
      ) : !hasAnyRecords ? (
        <EmptyState icon={FileText} title="No records yet" message="Once you add a pregnancy, child, or health encounter, your records will appear here." actionLabel="Add a health record" onAction={onOpenPregnancyRecords} />
      ) : (
        <section>
          <p className="mb-2 font-clinical text-[11px] font-semibold uppercase tracking-wide text-text-muted">Record categories</p>
          <div className="space-y-3">
            {(Object.keys(CATEGORY_ICONS) as CategoryKey[]).map((key) => {
              const data = categories[key];
              if (!data) return null;
              const Icon = CATEGORY_ICONS[key];
              return <button key={key} onClick={openCategory[key]} className="flex w-full items-center gap-3.5 rounded-xl border border-border-light bg-white p-4 text-left shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-surface"><Icon className="h-5 w-5 text-brand-primary" /></div>
                <div className="flex-1"><p className="font-consumer text-sm font-bold text-text-primary">{CATEGORY_LABELS[key]}</p><p className="font-clinical text-xs text-text-muted">{data.count === 0 ? 'No records yet' : `${data.count} record${data.count === 1 ? '' : 's'} · ${data.verified} verified`}</p></div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </button>;
            })}
          </div>
        </section>
      )}
    </div>
  );
};
