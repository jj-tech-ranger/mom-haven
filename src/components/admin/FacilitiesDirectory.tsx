// src/components/admin/FacilitiesDirectory.tsx
import React, { useState } from 'react';
import { 
  Building2, Search, Filter, Plus, Phone, MapPin, CheckCircle, 
  XCircle, AlertCircle, Edit, Trash2, HeartPulse, Activity, Shield
} from 'lucide-react';

export interface HealthFacility {
  id: string;
  mflCode: string; // Master Facility List Code
  name: string;
  level: 'Level 2 Dispensary' | 'Level 3 Health Centre' | 'Level 4 Primary Hospital' | 'Level 5 Secondary Referral' | 'Level 6 National Tertiary';
  county: string;
  subCounty: string;
  has24hrMaternity: boolean;
  hasCSectionTheatre: boolean;
  hasBloodTransfusion: boolean;
  hasNICUorKMC: boolean; // Kangaroo Mother Care
  emergencyHotline: string;
  ambulanceContact: string;
  latitude: number;
  longitude: number;
  status: 'OPERATIONAL' | 'UPGRADING' | 'TEMPORARILY_CLOSED';
}

const INITIAL_FACILITIES: HealthFacility[] = [
  {
    id: 'fac_001',
    mflCode: '13125',
    name: 'Pumwani Maternity Hospital',
    level: 'Level 5 Secondary Referral',
    county: 'Nairobi',
    subCounty: 'Kamukunji',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 20 231 2345',
    ambulanceContact: '+254 722 000 111',
    latitude: -1.2821,
    longitude: 36.8456,
    status: 'OPERATIONAL'
  },
  {
    id: 'fac_002',
    mflCode: '13028',
    name: 'Kenyatta National Hospital (KNH)',
    level: 'Level 6 National Tertiary',
    county: 'Nairobi',
    subCounty: 'Kibra',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 20 272 6300',
    ambulanceContact: '+254 711 000 999',
    latitude: -1.3015,
    longitude: 36.8073,
    status: 'OPERATIONAL'
  },
  {
    id: 'fac_003',
    mflCode: '15320',
    name: 'Nakuru Level 5 Teaching & Referral Hospital',
    level: 'Level 5 Secondary Referral',
    county: 'Nakuru',
    subCounty: 'Nakuru Town East',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 51 221 5500',
    ambulanceContact: '+254 733 999 888',
    latitude: -0.2833,
    longitude: 36.0667,
    status: 'OPERATIONAL'
  },
  {
    id: 'fac_004',
    mflCode: '13982',
    name: 'Jaramogi Oginga Odinga Teaching & Referral (JOOTRH)',
    level: 'Level 5 Secondary Referral',
    county: 'Kisumu',
    subCounty: 'Kisumu Central',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 57 202 0100',
    ambulanceContact: '+254 720 111 222',
    latitude: -0.0917,
    longitude: 34.7680,
    status: 'OPERATIONAL'
  },
  {
    id: 'fac_005',
    mflCode: '11648',
    name: 'Coast General Teaching & Referral Hospital',
    level: 'Level 5 Secondary Referral',
    county: 'Mombasa',
    subCounty: 'Mvita',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 41 231 4204',
    ambulanceContact: '+254 722 777 888',
    latitude: -4.0435,
    longitude: 39.6682,
    status: 'OPERATIONAL'
  },
  {
    id: 'fac_006',
    mflCode: '14210',
    name: 'Machakos Level 5 Hospital',
    level: 'Level 5 Secondary Referral',
    county: 'Machakos',
    subCounty: 'Machakos Central',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 44 202 02',
    ambulanceContact: '+254 711 333 444',
    latitude: -1.5177,
    longitude: 37.2634,
    status: 'OPERATIONAL'
  },
  {
    id: 'fac_007',
    mflCode: '15891',
    name: 'Moi Teaching and Referral Hospital (MTRH)',
    level: 'Level 6 National Tertiary',
    county: 'Uasin Gishu',
    subCounty: 'Ainabkoi',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    emergencyHotline: '+254 53 203 3471',
    ambulanceContact: '+254 722 201 277',
    latitude: 0.5143,
    longitude: 35.2698,
    status: 'OPERATIONAL'
  }
];

export const FacilitiesDirectory: React.FC = () => {
  const [facilities, setFacilities] = useState<HealthFacility[]>(INITIAL_FACILITIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<HealthFacility | null>(null);

  // Form state
  const [newFacility, setNewFacility] = useState<Partial<HealthFacility>>({
    level: 'Level 4 Primary Hospital',
    county: 'Nairobi',
    has24hrMaternity: true,
    hasCSectionTheatre: true,
    hasBloodTransfusion: true,
    hasNICUorKMC: true,
    status: 'OPERATIONAL'
  });

  const counties = ['ALL', ...Array.from(new Set(facilities.map(f => f.county)))];

  const filtered = facilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.mflCode.includes(searchTerm) ||
                          f.subCounty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCounty = countyFilter === 'ALL' || f.county === countyFilter;
    return matchesSearch && matchesCounty;
  });

  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacility.name || !newFacility.mflCode) return;

    const facilityToAdd: HealthFacility = {
      id: 'fac_' + Date.now(),
      mflCode: newFacility.mflCode || '',
      name: newFacility.name || '',
      level: (newFacility.level as any) || 'Level 4 Primary Hospital',
      county: newFacility.county || 'Nairobi',
      subCounty: newFacility.subCounty || 'Central',
      has24hrMaternity: Boolean(newFacility.has24hrMaternity),
      hasCSectionTheatre: Boolean(newFacility.hasCSectionTheatre),
      hasBloodTransfusion: Boolean(newFacility.hasBloodTransfusion),
      hasNICUorKMC: Boolean(newFacility.hasNICUorKMC),
      emergencyHotline: newFacility.emergencyHotline || '+254 700 000 000',
      ambulanceContact: newFacility.ambulanceContact || '+254 700 000 000',
      latitude: Number(newFacility.latitude) || -1.286389,
      longitude: Number(newFacility.longitude) || 36.817223,
      status: 'OPERATIONAL'
    };

    setFacilities(prev => [facilityToAdd, ...prev]);
    setIsAddModalOpen(false);
    setNewFacility({
      level: 'Level 4 Primary Hospital',
      county: 'Nairobi',
      has24hrMaternity: true,
      hasCSectionTheatre: true,
      hasBloodTransfusion: true,
      hasNICUorKMC: true,
      status: 'OPERATIONAL'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">MFL Registered Facilities</span>
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{facilities.length}</p>
          <p className="text-xs text-teal-600 mt-1">KMHFL Master Dataset v2026.2</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">24/7 Maternity Units</span>
            <HeartPulse className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {facilities.filter(f => f.has24hrMaternity).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ready for active labor admissions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">C-Section & Transfusion</span>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {facilities.filter(f => f.hasCSectionTheatre && f.hasBloodTransfusion).length}
          </p>
          <p className="text-xs text-indigo-600 mt-1">Comprehensive EmOC Capable</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">NICU / KMC Centers</span>
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {facilities.filter(f => f.hasNICUorKMC).length}
          </p>
          <p className="text-xs text-amber-600 mt-1">Newborn resuscitation equipped</p>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by facility name, KMHFL code, sub-county..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {counties.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Counties' : `${c} County`}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Facility
          </button>
        </div>
      </div>

      {/* Facilities Grid / Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Facility & MFL Code</th>
                <th className="py-3.5 px-4">Level & County</th>
                <th className="py-3.5 px-4">Emergency Capabilities (EmOC)</th>
                <th className="py-3.5 px-4">Hotline / Dispatch</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(fac => (
                <tr key={fac.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{fac.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      KMHFL #{fac.mflCode}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium text-xs">
                      {fac.level}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {fac.county}, {fac.subCounty}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {fac.has24hrMaternity && (
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[11px] font-semibold">
                          24h Maternity
                        </span>
                      )}
                      {fac.hasCSectionTheatre && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-semibold">
                          C-Section
                        </span>
                      )}
                      {fac.hasBloodTransfusion && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] font-semibold">
                          Transfusion
                        </span>
                      )}
                      {fac.hasNICUorKMC && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[11px] font-semibold">
                          NICU / KMC
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-teal-600" /> {fac.emergencyHotline}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Amb: {fac.ambulanceContact}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setSelectedFacility(fac)}
                      className="px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50 rounded-lg font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Facility Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" /> Add KMHFL Facility
            </h3>
            <form onSubmit={handleAddFacility} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mbagathi District Hospital"
                  value={newFacility.name || ''}
                  onChange={e => setNewFacility({ ...newFacility, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">KMHFL Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12940"
                    value={newFacility.mflCode || ''}
                    onChange={e => setNewFacility({ ...newFacility, mflCode: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Facility Level</label>
                  <select
                    value={newFacility.level}
                    onChange={e => setNewFacility({ ...newFacility, level: e.target.value as any })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="Level 2 Dispensary">Level 2 Dispensary</option>
                    <option value="Level 3 Health Centre">Level 3 Health Centre</option>
                    <option value="Level 4 Primary Hospital">Level 4 Primary Hospital</option>
                    <option value="Level 5 Secondary Referral">Level 5 Secondary Referral</option>
                    <option value="Level 6 National Tertiary">Level 6 National Tertiary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">County</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nairobi"
                    value={newFacility.county || ''}
                    onChange={e => setNewFacility({ ...newFacility, county: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Sub-County</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kibra"
                    value={newFacility.subCounty || ''}
                    onChange={e => setNewFacility({ ...newFacility, subCounty: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Emergency Hotline</label>
                  <input
                    type="text"
                    placeholder="+254 700 000 000"
                    value={newFacility.emergencyHotline || ''}
                    onChange={e => setNewFacility({ ...newFacility, emergencyHotline: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Ambulance Dispatch</label>
                  <input
                    type="text"
                    placeholder="+254 700 000 000"
                    value={newFacility.ambulanceContact || ''}
                    onChange={e => setNewFacility({ ...newFacility, ambulanceContact: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="font-semibold text-gray-700 block">Emergency Obstetric & Newborn Capabilities</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFacility.has24hrMaternity}
                      onChange={e => setNewFacility({ ...newFacility, has24hrMaternity: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>24/7 Maternity Unit</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFacility.hasCSectionTheatre}
                      onChange={e => setNewFacility({ ...newFacility, hasCSectionTheatre: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>C-Section Theatre</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFacility.hasBloodTransfusion}
                      onChange={e => setNewFacility({ ...newFacility, hasBloodTransfusion: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Blood Transfusion</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFacility.hasNICUorKMC}
                      onChange={e => setNewFacility({ ...newFacility, hasNICUorKMC: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>NICU / KMC Care</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-medium shadow-sm"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Facility Detail Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedFacility.name}</h3>
            <p className="text-xs text-gray-500 font-mono mb-4">KMHFL #{selectedFacility.mflCode} • {selectedFacility.level}</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 block">Location Coordinates</span>
                <span className="font-mono text-gray-800 font-semibold">{selectedFacility.latitude}, {selectedFacility.longitude}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 block">Emergency Dispatch Line</span>
                <span className="text-teal-800 font-bold text-sm">{selectedFacility.emergencyHotline}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 block">Sub-County Jurisdiction</span>
                <span className="text-gray-800 font-medium">{selectedFacility.county} County ({selectedFacility.subCounty})</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedFacility(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
