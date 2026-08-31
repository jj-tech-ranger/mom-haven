import React from 'react';
import { ChevronLeft, Baby, Plus, ChevronRight, Calendar } from 'lucide-react';
import { ChildDoc } from '../../types';

interface ProfileChildrenProps {
  childrenList: ChildDoc[];
  onBack: () => void;
  onSelectChild: (c: ChildDoc) => void;
  onAddChild: () => void;
}

export const ProfileChildren: React.FC<ProfileChildrenProps> = ({
  childrenList,
  onBack,
  onSelectChild,
  onAddChild,
}) => {
  const displayList = childrenList.length > 0 ? childrenList : [
    {
      id: 'child_1',
      motherId: 'user_1',
      name: 'Baby Amara',
      dateOfBirth: '2026-01-14',
      sex: 'female' as const,
      createdAt: '2026-01-14',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Children</h1>
        <button
          onClick={onAddChild}
          className="w-10 h-10 rounded-full bg-white border border-haven-deep/20 shadow-sm flex items-center justify-center text-haven-deep active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          MY CHILDREN ({displayList.length})
        </span>

        <div className="space-y-2.5">
          {displayList.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectChild(c)}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
                  <Baby className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-ink-900 leading-snug">
                    {c.name || 'Unnamed Baby'}
                  </h4>
                  <p className="font-body text-xs text-ink-600 mt-0.5">
                    Born {c.dateOfBirth} · {c.sex === 'female' ? 'Girl' : 'Boy'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Child Action */}
      <div className="pt-2">
        <button
          onClick={onAddChild}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add another child</span>
        </button>
      </div>
    </div>
  );
};
