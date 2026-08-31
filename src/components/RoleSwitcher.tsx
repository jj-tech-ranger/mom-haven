import React from 'react';
import { AppViewRole } from '../types';
import { Heart, Users, Stethoscope, ShieldCheck, AlertCircle } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: AppViewRole;
  onRoleChange: (role: AppViewRole) => void;
  onOpenEmergency?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
}) => {
  const roles: Array<{ id: AppViewRole; label: string; icon: React.ReactNode }> = [
    { id: 'mother', label: 'Mother', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'partner', label: 'Partner', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'clinician', label: 'Clinician', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside aria-label="Developer Role Switcher" className="w-full bg-[#241451] text-white text-xs px-4 py-2 border-b border-[#33178A] flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-2 font-mono">
        <span className="flex items-center gap-1 bg-[#A15E06] text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase">
          <AlertCircle className="w-3 h-3" />
          DEV ONLY — remove before launch
        </span>
        <span className="text-[#B79CDA] hidden sm:inline">
          Testing Role Shells:
        </span>
      </div>

      <nav aria-label="Role Switcher Navigation" className="flex items-center bg-[#33178A] p-0.5 rounded-pill border border-[#9167C2]/30">
        {roles.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onRoleChange(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-pill text-[12px] font-display font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-haven-orchid text-white shadow-sm'
                  : 'text-[#B79CDA] hover:text-white hover:bg-white/10'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
