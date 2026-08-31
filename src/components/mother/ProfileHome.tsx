import React from 'react';
import {
  User,
  Heart,
  Baby,
  Users,
  Share2,
  Bell,
  Lock,
  Shield,
  Info,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { MotherProfileDoc, UserDoc } from '../../types';

interface ProfileHomeProps {
  user: UserDoc | { uid: string; displayName: string; email: string };
  motherProfile?: MotherProfileDoc | null;
  onNavigate: (section: string) => void;
  onSignOut?: () => void;
}

export const ProfileHome: React.FC<ProfileHomeProps> = ({
  user,
  motherProfile,
  onNavigate,
  onSignOut,
}) => {
  const displayName = motherProfile?.fullName || (user as any)?.displayName || 'Jemimah Cherotich';
  const initial = displayName.charAt(0).toUpperCase();

  const settingsGroups = [
    {
      group: 'Care & Family',
      items: [
        { id: 'personal_info', label: 'Personal Information', icon: User, note: 'Name, phone, DOB' },
        { id: 'pregnancies', label: 'Pregnancies', icon: Heart, note: 'Active & past journeys' },
        { id: 'children', label: 'Children', icon: Baby, note: 'Profiles & health records' },
        { id: 'partner_mgmt', label: 'Partner Management', icon: Users, note: 'Connection & sharing' },
      ],
    },
    {
      group: 'Clinic & Access',
      items: [
        { id: 'clinician_sharing', label: 'Clinician Sharing', icon: Share2, note: 'Temporary Clinic Share codes' },
        { id: 'connected_access', label: 'Connected Access Grants', icon: Users, note: 'Active permissions' },
      ],
    },
    {
      group: 'Security & Preferences',
      items: [
        { id: 'security', label: 'Security & App Lock PIN', icon: Lock, note: 'Stays on this device' },
        { id: 'notifications', label: 'Notification Settings', icon: Bell, note: 'ANC, vaccine & habit reminders' },
        { id: 'privacy', label: 'Privacy & Consent', icon: Shield, note: 'Data governance' },
        { id: 'about', label: 'About MomHaven', icon: Info, note: 'Version 2.4.0 (Kenya MCH)' },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Header with Avatar */}
      <div className="flex items-center gap-4 bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-haven-deep to-haven-orchid flex items-center justify-center text-white font-display font-bold text-2xl shadow-md flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
            {displayName}
          </h2>
          <p className="font-body text-xs text-ink-600 mt-0.5">
            {motherProfile?.phone || '+254 712 345 678'}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full bg-lavender-100 text-haven-deep text-[10px] font-display font-bold">
            MomHaven Primary Caregiver
          </span>
        </div>
      </div>

      {/* Grouped Settings Sections */}
      {settingsGroups.map((g) => (
        <div key={g.group} className="space-y-2.5">
          <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
            {g.group}
          </span>
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 divide-y divide-border-hairline/60 overflow-hidden">
            {g.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-lavender-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-lavender-100/70 text-haven-orchid flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-ink-900 leading-snug">
                        {item.label}
                      </h4>
                      <p className="font-body text-[11px] text-ink-600">{item.note}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-600" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sign Out Button */}
      {onSignOut && (
        <div className="pt-2">
          <button
            onClick={onSignOut}
            className="w-full py-3.5 px-6 bg-white border border-red-200 text-red-600 font-display font-bold text-sm rounded-pill hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out of MomHaven</span>
          </button>
        </div>
      )}
    </div>
  );
};
