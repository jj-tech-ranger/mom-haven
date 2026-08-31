import React from 'react';
import { ChevronLeft, Heart, Plus, ChevronRight, Calendar } from 'lucide-react';
import { PregnancyDoc } from '../../types';

interface ProfilePregnanciesProps {
  pregnancies: PregnancyDoc[];
  onBack: () => void;
  onSelectPregnancy: (p: PregnancyDoc) => void;
  onAddPregnancy: () => void;
}

export const ProfilePregnancies: React.FC<ProfilePregnanciesProps> = ({
  pregnancies,
  onBack,
  onSelectPregnancy,
  onAddPregnancy,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Pregnancies</h1>
        <button
          onClick={onAddPregnancy}
          className="w-10 h-10 rounded-full bg-white border border-haven-deep/20 shadow-sm flex items-center justify-center text-haven-deep active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          RECORDED PREGNANCIES
        </span>

        <div className="space-y-2.5">
          {pregnancies.map((p) => {
            const isActive = p.status === 'active';
            return (
              <div
                key={p.id}
                onClick={() => onSelectPregnancy(p)}
                className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-sm text-ink-900">
                        {isActive ? 'Current Pregnancy' : 'Completed Pregnancy'}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-display font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-lavender-100 text-haven-deep'
                        }`}
                      >
                        {isActive ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    <p className="font-body text-xs text-ink-600 mt-0.5">
                      EDD: {p.edd || p.estimatedDeliveryDate || 'Not set'} · Week {p.gestationalAgeWeeks || 24}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-600" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Button */}
      <div className="pt-2">
        <button
          onClick={onAddPregnancy}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add another pregnancy</span>
        </button>
      </div>
    </div>
  );
};
