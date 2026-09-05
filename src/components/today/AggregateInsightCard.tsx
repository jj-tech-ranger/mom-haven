// src/components/today/AggregateInsightCard.tsx
import React, { useEffect, useState } from 'react';
import { Users, Heart } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AggregateInsightBucket } from '../../types';

interface AggregateInsightCardProps {
  lifecycleStage?: 'pregnancy' | 'postnatal';
  trimester?: 'trimester_1' | 'trimester_2' | 'trimester_3' | null;
  gestationalWeeks?: number | null;
}

/**
 * Read-only Aggregate Peer Insight Card.
 * Adheres strictly to the k >= 50 anonymity rule from docs/aggregate-insights-plan.md:
 * - Reads only from the server-computed aggregateInsightBuckets collection.
 * - Renders ONLY if doc exists AND cohortSize >= 50.
 * - Falls back silently (returns null / renders nothing at all) if doc missing or cohortSize < 50.
 * - Zero county axis, zero peer-to-peer comparison, zero community features.
 */
export default function AggregateInsightCard({
  lifecycleStage = 'pregnancy',
  trimester,
  gestationalWeeks,
}: AggregateInsightCardProps) {
  const [insight, setInsight] = useState<AggregateInsightBucket | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Compute bucket key based on mother's current lifecycle stage + trimester
  let targetBucketId = 'trimester_2';
  if (lifecycleStage === 'postnatal') {
    targetBucketId = 'postnatal';
  } else if (trimester) {
    targetBucketId = trimester;
  } else if (typeof gestationalWeeks === 'number' && gestationalWeeks > 0) {
    if (gestationalWeeks <= 13) {
      targetBucketId = 'trimester_1';
    } else if (gestationalWeeks <= 27) {
      targetBucketId = 'trimester_2';
    } else {
      targetBucketId = 'trimester_3';
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAggregateStat() {
      try {
        const docRef = doc(db, 'aggregateInsightBuckets', targetBucketId);
        const snap = await getDoc(docRef);

        if (!isMounted) return;

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as AggregateInsightBucket;
          // STRICT PRIVACY GUARDRAIL: Must have cohortSize >= 50
          if (data && typeof data.cohortSize === 'number' && data.cohortSize >= 50) {
            setInsight(data);
          } else {
            // Silent fallback: cohort size below threshold
            setInsight(null);
          }
        } else {
          // Silent fallback: no aggregate bucket pre-computed
          setInsight(null);
        }
      } catch (err) {
        // Silent fallback on any error
        if (isMounted) setInsight(null);
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    loadAggregateStat();

    return () => {
      isMounted = false;
    };
  }, [targetBucketId]);

  // SILENT FALLBACK:
  // If still loading or if data missing or if cohortSize < 50, render nothing at all.
  if (!loaded || !insight || insight.cohortSize < 50) {
    return null;
  }

  return (
    <div
      id="aggregate-peer-insight-card"
      className="bg-white rounded-[20px] p-4 sm:p-5 border border-purple-100 shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 shrink-0 mt-0.5">
          <Users className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              You're Not Alone
            </span>
            <span className="text-[10px] font-medium text-gray-500">
              Trailing 7 Days
            </span>
          </div>

          <p className="font-medium text-gray-900 text-sm mt-1 leading-snug">
            {insight.summaryText ||
              `${insight.roundedPercentage}% of mothers in your stage ${insight.statDescription}.`}
          </p>

          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-500">
            <Heart className="w-3 h-3 text-rose-500 shrink-0" />
            <span>
              Shared across {insight.cohortSize}+ verified mothers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
