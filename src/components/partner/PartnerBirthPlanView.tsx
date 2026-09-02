// src/components/partner/PartnerBirthPlanView.tsx
import React, { useState } from 'react';
import { 
  MapPin, 
  Car, 
  PhoneCall, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  HeartHandshake,
  DollarSign,
  Package
} from 'lucide-react';
import Button from '../Button';

interface PartnerBirthPlanViewProps {
  motherName?: string;
  initialHospital?: string;
  initialDriverName?: string;
  initialDriverPhone?: string;
  initialBackupDriver?: string;
  initialBackupPhone?: string;
  initialTransportMode?: string;
  onSaveTransportPlan?: (data: {
    hospital: string;
    driverName: string;
    driverPhone: string;
    backupDriver: string;
    backupPhone: string;
    transportMode: string;
  }) => void;
}

export default function PartnerBirthPlanView({
  motherName = 'Mother',
  initialHospital = 'Pumwani Maternity Hospital (Level 5)',
  initialDriverName = 'John Mwangi (Taxi / Boda)',
  initialDriverPhone = '+254 712 345 678',
  initialBackupDriver = 'Uncle Peter (Private Vehicle)',
  initialBackupPhone = '+254 722 987 654',
  initialTransportMode = 'Taxi / Uber / Private Cab',
  onSaveTransportPlan
}: PartnerBirthPlanViewProps) {
  const [hospital, setHospital] = useState(initialHospital);
  const [driverName, setDriverName] = useState(initialDriverName);
  const [driverPhone, setDriverPhone] = useState(initialDriverPhone);
  const [backupDriver, setBackupDriver] = useState(initialBackupDriver);
  const [backupPhone, setBackupPhone] = useState(initialBackupPhone);
  const [transportMode, setTransportMode] = useState(initialTransportMode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Hospital bag items
  const [bagItems, setBagItems] = useState([
    { id: '1', label: 'Mother & Baby Clothes + Shawl / Leso', packed: true },
    { id: '2', label: 'MOH 216 Mother & Child Health Handbook', packed: true },
    { id: '3', label: 'National ID & NHIF / SHA Card / Number', packed: true },
    { id: '4', label: 'Maternity sanitary pads & cotton wool', packed: true },
    { id: '5', label: 'Newborn diapers & baby petroleum jelly', packed: true },
    { id: '6', label: 'Flask for warm drinking water / porridge', packed: false },
    { id: '7', label: 'Phone charger & backup battery powerbank', packed: true },
  ]);

  const toggleBagItem = (id: string) => {
    setBagItems(prev => prev.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveTransportPlan) {
      onSaveTransportPlan({
        hospital,
        driverName,
        driverPhone,
        backupDriver,
        backupPhone,
        transportMode
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[var(--border-hairline)] p-4 sm:p-5 rounded-[22px] shadow-card-1">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[16px] text-[var(--ink-900)] leading-tight">
              Individual Birth Plan (Partner Logistics)
            </h2>
            <p className="text-[11px] text-[var(--ink-600)]">
              Coordinated birth preparedness aligned with Kenya MOH guidelines.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] rounded-[14px] flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Transport logistics updated and saved successfully!</span>
        </div>
      )}

      {/* Transport Logistics Form */}
      <form onSubmit={handleSave} className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
            <Car className="w-4 h-4 text-[var(--haven-orchid)]" />
            Emergency Delivery Transport
          </h3>
          <span className="text-[10px] bg-purple-100 text-[var(--haven-deep)] px-2 py-0.5 rounded-full font-bold">
            Partner Editable
          </span>
        </div>

        <div className="space-y-3 text-[12px]">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
              Designated Delivery Hospital
            </label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] text-[var(--ink-900)] font-semibold text-[13px] focus:outline-none focus:border-[var(--haven-orchid)]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                Transport Mode
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white text-[var(--ink-900)] text-[12px] focus:outline-none focus:border-[var(--haven-orchid)]"
              >
                <option>Taxi / Uber / Private Cab</option>
                <option>Personal Private Car</option>
                <option>Neighbor / Family Vehicle</option>
                <option>Community Motorbike (Boda Boda)</option>
                <option>Subcounty Ambulance (Red Cross 1199)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                Primary Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white text-[var(--ink-900)] text-[12px] focus:outline-none focus:border-[var(--haven-orchid)]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                Primary Driver Phone
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white text-[var(--ink-900)] text-[12px] focus:outline-none focus:border-[var(--haven-orchid)]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                Backup Driver &amp; Phone
              </label>
              <input
                type="text"
                value={`${backupDriver} · ${backupPhone}`}
                onChange={(e) => {
                  const parts = e.target.value.split('·');
                  setBackupDriver(parts[0] ? parts[0].trim() : '');
                  setBackupPhone(parts[1] ? parts[1].trim() : '');
                }}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white text-[var(--ink-900)] text-[12px] focus:outline-none focus:border-[var(--haven-orchid)]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="submit" variant="primary" className="flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Save Transport Details
            </Button>
            <a
              href={`tel:${driverPhone.replace(/\s+/g, '')}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold py-2.5 px-4 rounded-full text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call Driver
            </a>
          </div>
        </div>
      </form>

      {/* Hospital Maternity Bag Checklist */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[var(--haven-orchid)]" />
            Hospital Maternity Bag (Packed in Advance)
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700">
            {bagItems.filter(b => b.packed).length}/{bagItems.length} Packed
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {bagItems.map(item => (
            <label
              key={item.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-[12px] border transition-all cursor-pointer ${
                item.packed 
                  ? 'bg-emerald-50/50 border-emerald-200/80 text-[var(--ink-800)]' 
                  : 'bg-white border-[var(--border-hairline)] text-[var(--ink-900)] hover:border-[var(--haven-orchid)]'
              }`}
            >
              <input
                type="checkbox"
                checked={item.packed}
                onChange={() => toggleBagItem(item.id)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span className={`text-[12px] font-body ${item.packed ? 'line-through text-gray-500' : 'font-medium'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Emergency Funds & Blood Donors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-card-1 space-y-2">
          <div className="flex items-center gap-2 text-[var(--haven-deep)] font-display font-bold text-[13px]">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>M-Pesa Emergency Fund</span>
          </div>
          <p className="text-[11px] text-[var(--ink-600)]">
            Keep KES 3,000 - 5,000 reserved on M-Pesa for instant night taxi fare, medications, and admission contingencies.
          </p>
          <div className="p-2 bg-emerald-50 rounded-[10px] text-emerald-900 font-bold text-[12px]">
            ✓ Status: Liquid Funds Reserved
          </div>
        </div>

        <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-card-1 space-y-2">
          <div className="flex items-center gap-2 text-[var(--haven-deep)] font-display font-bold text-[13px]">
            <Users className="w-4 h-4 text-red-600" />
            <span>Pre-Identified Blood Donors</span>
          </div>
          <p className="text-[11px] text-[var(--ink-600)]">
            Two family members or friends willing to donate blood at the maternity facility if postpartum haemorrhage occurs.
          </p>
          <div className="p-2 bg-red-50 rounded-[10px] text-red-900 font-bold text-[12px]">
            ✓ Donors: Eric (O+) &amp; David (B+)
          </div>
        </div>
      </div>
    </div>
  );
}
