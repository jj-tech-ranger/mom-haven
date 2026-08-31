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

export const RecordsHome: React.FC<RecordsHomeProps> = ({
  onOpenPregnancyRecords,
  onOpenChildRecords,
  onOpenImmunizationRecords,
  onOpenGrowthRecords,
}) => {
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
      state[key] = {
        count: docs.length,
        verified: docs.filter((d) => d.provenance?.status === 'VERIFIED').length,
      };
      setCategories({ ...state });
    };

    const pregnancyUnsub = onSnapshot(
      query(collection(db, 'pregnancies'), where('motherId', '==', userId)),
      (snapshot) => setCategory('pregnancy', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } })),
      () => setCategory('pregnancy', [])
    );

    const childIds = new Set<string>();
    const childUnsub = onSnapshot(
      query(collection(db, 'children'), where('motherId', '==', userId)),
      (snapshot) => {
        childIds.clear();
        snapshot.docs.forEach((d) => childIds.add(d.id));
        setCategory('child', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } }));
      },
      () => setCategory('child', [])
    );

    const immunizationUnsub = onSnapshot(
      collectionGroup(db, 'immunizationRecords'),
      (snapshot) => {
        const docs = snapshot.docs.filter((d) => childIds.has(d.ref.parent.parent?.id || '')).map((d) => ({ ...d.data(), childId: d.ref.parent.parent?.id }));
        setCategory('immunization', docs as Array<{ provenance?: { status?: string } }>);
      },
      () => setCategory('immunization', [])
    );

    const growthUnsub = onSnapshot(
      collectionGroup(db, 'growthMeasurements'),
      (snapshot) => {
        const docs = snapshot.docs.filter((d) => childIds.has(d.ref.parent.parent?.id || '')).map((d) => ({ ...d.data(), childId: d.ref.parent.parent?.id }));
        setCategory('growth', docs as Array<{ provenance?: { status?: string } }>);
      },
      () => setCategory('growth', [])
    );

    return () => { pregnancyUnsub(); childUnsub(); immunizationUnsub(); growthUnsub(); };
  }, [userId]);

  const hasAnyRecords = useMemo(() => categories !== null && Object.values(categories).some((c) => c && c.count > 0), [categories]);
  const openCategory: Record<CategoryKey, () => void> = {
    pregnancy: onOpenPregnancyRecords,
    child: onOpenChildRecords,
    immunization: onOpenImmunizationRecords,
    growth: onOpenGrowthRecords,
  };

  return (
    <div className="px-5 pb-24 animate-fade-in">
      <div className="rounded-card p-[22px] text-center text-white mb-4" style={{ background: 'var(--grad-haven)' }}>
        <Shield className="w-[26px] h-[26px] mx-auto text-white" strokeWidth={2} />
        <p className="font-display font-bold text-[15px] mt-2">Your secure health vault</p>
        <p className="font-body text-[12px] text-white/80 mt-1">Everything you and your clinicians have recorded, in one place</p>
      </div>

      {categories === null ? (
        <div className="space-y-3" aria-label="Loading records">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[68px] rounded-card bg-lavender-100 animate-pulse" />)}</div>
      ) : !hasAnyRecords ? (
        <EmptyState icon={FileText} title="No records yet" message="Once you add a pregnancy or a child, your records will appear here." actionLabel="Add pregnancy or child" onAction={onOpenPregnancyRecords} />
      ) : (
        <>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600 mb-2 px-0.5">Categories</p>
          <div className="space-y-3">
            {(Object.keys(CATEGORY_ICONS) as CategoryKey[]).map((key) => {
              const data = categories[key];
              if (!data) return null;
              const Icon = CATEGORY_ICONS[key];
              return (
                <button key={key} onClick={openCategory[key]} className="w-full text-left bg-white rounded-card p-[16px] shadow-card-1 flex items-center gap-3.5 border border-border-hairline">
                  <div className="w-[46px] h-[46px] rounded-[14px] bg-lavender-100 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-haven-deep" strokeWidth={2} /></div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-[14px] text-ink-900 capitalize">{key}</p>
                    <p className="font-body text-[12px] text-ink-600">{data.count === 0 ? 'No records yet' : `${data.count} record${data.count === 1 ? '' : 's'} · ${data.verified} verified`}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-400" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
