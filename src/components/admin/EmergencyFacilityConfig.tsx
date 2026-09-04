// src/components/admin/EmergencyFacilityConfig.tsx
import React, { useState } from 'react';
import { 
  PhoneCall, ShieldAlert, Plus, Edit2, CheckCircle2, 
  AlertTriangle, Building, MapPin, Radio
} from 'lucide-react';

export interface EmergencyLine {
  id: string;
  name: string;
  hotline: string;
  category: 'NATIONAL_CRISIS' | 'GBV_SUPPORT' | 'POLICE_AMBULANCE' | 'COUNTY_DISPATCH';
  description: string;
  coverage: string;
  status: 'ACTIVE_24_7' | 'MAINTENANCE';
}

const INITIAL_HOTLINES: EmergencyLine[] = [
  {
    id: 'hot_001',
    name: 'Kenya Red Cross Emergency & Ambulance Dispatch',
    hotline: '1199',
    category: 'NATIONAL_CRISIS',
    description: 'National 24/7 medical emergency dispatch, maternal trauma, ambulance mobilization.',
    coverage: 'Nationwide (Toll-Free)',
    status: 'ACTIVE_24_7'
  },
  {
    id: 'hot_002',
    name: 'National Gender-Based Violence (GBV) Helpline',
    hotline: '1195',
    category: 'GBV_SUPPORT',
    description: 'Free confidential counseling, legal escalation, rescue and medical referral for GBV survivors.',
    coverage: 'Nationwide (Toll-Free)',
    status: 'ACTIVE_24_7'
  },
  {
    id: 'hot_003',
    name: 'National Police & Emergency Services',
    hotline: '999 / 112',
    category: 'POLICE_AMBULANCE',
    description: 'Central security and critical ambulance dispatch hotline.',
    coverage: 'Nationwide (Toll-Free)',
    status: 'ACTIVE_24_7'
  },
  {
    id: 'hot_004',
    name: 'Nairobi County Emergency Ambulance Hub',
    hotline: '+254 722 000 111',
    category: 'COUNTY_DISPATCH',
    description: 'Direct dispatch for Pumwani Maternity, KNH, and Mbagathi emergency ambulances.',
    coverage: 'Nairobi County',
    status: 'ACTIVE_24_7'
  },
  {
    id: 'hot_005',
    name: 'Nakuru County Obstetric Rapid Response',
    hotline: '+254 733 999 888',
    category: 'COUNTY_DISPATCH',
    description: 'Dedicated maternal and newborn emergency transport coordination.',
    coverage: 'Nakuru County',
    status: 'ACTIVE_24_7'
  }
];

export const EmergencyFacilityConfig: React.FC = () => {
  const [hotlines, setHotlines] = useState<EmergencyLine[]>(INITIAL_HOTLINES);
  const [newHotline, setNewHotline] = useState<Partial<EmergencyLine>>({
    category: 'COUNTY_DISPATCH',
    status: 'ACTIVE_24_7'
  });
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotline.name || !newHotline.hotline) return;

    const item: EmergencyLine = {
      id: 'hot_' + Date.now(),
      name: newHotline.name || '',
      hotline: newHotline.hotline || '',
      category: (newHotline.category as any) || 'COUNTY_DISPATCH',
      description: newHotline.description || '',
      coverage: newHotline.coverage || 'Kenya',
      status: 'ACTIVE_24_7'
    };

    setHotlines([item, ...hotlines]);
    setIsAddOpen(false);
    setNewHotline({ category: 'COUNTY_DISPATCH', status: 'ACTIVE_24_7' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Active Emergency Dispatch Matrix</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Kenya Emergency Healthcare & GBV Helplines</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Hotlines automatically injected into AI safety escalation cards when maternal danger signs or crises are detected.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Emergency Hotline
        </button>
      </div>

      {/* Grid of Hotlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotlines.map(h => (
          <div
            key={h.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-800 rounded-md font-bold text-[11px]">
                  {h.category.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> 24/7 ACTIVE
                </span>
              </div>

              <h4 className="font-bold text-gray-900 text-sm">{h.name}</h4>
              <div className="text-2xl font-black text-rose-700 font-mono my-2 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-600" /> {h.hotline}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{h.description}</p>
            </div>

            <div className="text-[11px] text-gray-500 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" /> {h.coverage}
              </span>
              <span className="font-mono text-[10px] text-gray-400">{h.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Emergency Dispatch Contact</h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Service / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kisumu County Ambulance Hub"
                  value={newHotline.name || ''}
                  onChange={e => setNewHotline({ ...newHotline, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Hotline Number / Shortcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1199 or +254..."
                  value={newHotline.hotline || ''}
                  onChange={e => setNewHotline({ ...newHotline, hotline: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Category</label>
                <select
                  value={newHotline.category}
                  onChange={e => setNewHotline({ ...newHotline, category: e.target.value as any })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <option value="NATIONAL_CRISIS">National Medical Crisis (1199)</option>
                  <option value="GBV_SUPPORT">Gender-Based Violence Helpline (1195)</option>
                  <option value="POLICE_AMBULANCE">Police / General Emergency (999/112)</option>
                  <option value="COUNTY_DISPATCH">County Referral Ambulance Hub</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Coverage Area</label>
                <input
                  type="text"
                  placeholder="e.g. Kisumu County"
                  value={newHotline.coverage || ''}
                  onChange={e => setNewHotline({ ...newHotline, coverage: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Description</label>
                <textarea
                  placeholder="Dispatch instructions..."
                  value={newHotline.description || ''}
                  onChange={e => setNewHotline({ ...newHotline, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Save Hotline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
