import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Heart, Baby, Syringe, Scale, ChevronRight, FileText } from 'lucide-react';
import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import EmptyState from '../EmptyState';

type CategoryKey = 'pregnancy' | 'child' | 'immunization' | 'growth';
type CategoryData = { count: number; verified: number };
type Categories = Record<CategoryKey, CategoryData | null> | null;

interface RecordsHomeProps {
  userId: string;
  onOpenPregnancyRecords: () => void;
  onOpenChildRecords: () => void;
  onOpenImmunizationRecords: () => void;
  onOpenGrowthRecords: () => void;
}

const CATEGORY_ICONS = { pregnancy: Heart, child: Baby, immunization: Syringe, growth: Scale };

export const RecordsHome: React.FC<RecordsHomeProps> = ({
  userId,
  onOpenPregnancyRecords,
  onOpenChildRecords,
  onOpenImmunizationRecords,
  onOpenGrowthRecords,
}) => {
  const [categories, setCategories] = useState<Categories>(null);

  useEffect(() => {
    if (!userId) return;
    const pending: Record<CategoryKey, CategoryData | null> = {
      pregnancy: null,
      child: null,
      immunization: null,
      growth: null,
    };
    setCategories({ ...pending });

    const update = (key: CategoryKey, docs: Array<{ provenance?: { status?: string } }>) => {
      setCategories((current) => ({
        ...(current ?? pending),
        [key]: {
          count: docs.length,
          verified: docs.filter((d) => d.provenance?.status === 'VERIFIED').length,
        },
      }));
    };

    const pregnancyQuery = query(collection(db, 'pregnancies'), where('motherId', '==', userId));
    const childQuery = query(collection(db, 'children'), where('motherId', '==', userId));
    const pregnancyUnsub = onSnapshot(pregnancyQuery, (snapshot) => {
      update('pregnancy', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } }));
    }, () => update('pregnancy', []));
    const childUnsub = onSnapshot(childQuery, (snapshot) => {
      update('child', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } }));
    }, () => update('child', []));

    const immunizationUnsub = onSnapshot(collectionGroup(db, 'immunizationRecords'), (snapshot) => {
      const docs = snapshot.docs.filter((d) => (d.data() as { motherId?: string }).motherId === userId || true);
      // Child subcollections do not consistently carry motherId, so the parent-child ownership
      // check is performed by matching the known child IDs below once children are loaded.
      void docs;
    });

    let childIds: string[] = [];
    let immunizationSnapshot: Array<{ childId?: string; provenance?: { status?: string } }> = [];
    let growthSnapshot: Array<{ childId?: string; provenance?: { status?: string } }> = [];

    const refreshChildSubcollections = () => {
      update('immunization', immunizationSnapshot.filter((d) => !!d.childId && childIds.includes(d.childId)));
      update('growth', growthSnapshot.filter((d) => !!d.childId && childIds.includes(d.childId)));
    };

    const childDataUnsub = onSnapshot(childQuery, (snapshot) => {
      childIds = snapshot.docs.map((d) => d.id);
      update('child', snapshot.docs.map((d) => d.data() as { provenance?: { status?: string } }));
      refreshChildSubcollections();
    });
    const realImmunizationUnsub = onSnapshot(collectionGroup(db, 'immunizationRecords'), (snapshot) => {
      immunizationSnapshot = snapshot.docs.map((d) => ({ ...(d.data() as object), childId: d.data().childId || d.ref.parent.parent?.id }));
      refreshChildSubcollections();
    }, () => update('immunization', []));
    const growthUnsub = onSnapshot(collectionGroup(db, 'growthMeasurements'), (snapshot) => {
      growthSnapshot = snapshot.docs.map((d) => ({ ...(d.data() as object), childId: d.data().childId || d.ref.parent.parent?.id }));
      refreshChildSubcollections();
    }, () => update('growth', []));

    return () => {
      pregnancyUnsub();
      childUnsub();
      childDataUnsub();
      immunizationUnsub();
      realImmunizationUnsub();
      growthUnsub();
    };
  }, [userId]);

  const hasAnyRecords = useMemo(
    () => categories !== null && Object.values(categories).some((c) => c !== null && c.count > 0),
    [categories]
  );

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
        <div className="space-y-3" aria-label="Loading records">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-[68px] rounded-card bg-lavender-100 animate-pulse" />)}
        </div>
      ) : !hasAnyRecords ? (
        <EmptyState
          icon={FileText}
          title="No records yet"
          message="Once you add a pregnancy or a child, your records will appear here."
          actionLabel="Add pregnancy or child"
          onAction={onOpenPregnancyRecords}
        />
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
                  <div className="w-[46px] h-[46px] rounded-[14px] bg-lavender-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-haven-deep" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-[14px] text-ink-900 capitalize">{key}</p>
                    <p className="font-body text-[12px] text-ink-600">
                      {data.count === 0 ? 'No records yet' : `${data.count} record${data.count === 1 ? '' : 's'} · ${data.verified} verified`}
                    </p>
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
