// src/components/admin/PlatformAuditLog.tsx
import React, { useState } from 'react';
import { 
  FileCheck2, Search, Filter, Download, ShieldCheck, 
  Clock, User, Lock, AlertTriangle, ArrowDownToLine
} from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: 'MOTHER' | 'CLINICIAN' | 'ADMIN' | 'SYSTEM_INTERCEPTOR';
  actorIdentifier: string; // e.g. "KMPDC/A49281" or "admin_super_01" or "anon_mother_98"
  actionType: 'SESSION_INITIALIZED' | 'RECORD_VERIFIED' | 'PRESCRIPTION_BLOCKED' | 'ACCESS_REVOKED' | 'DATA_EXPORT_REQUEST' | 'CLINICIAN_CREDENTIALED';
  targetResource: string;
  sha256Signature: string;
  ipHash: string;
  status: 'SUCCESS' | 'BLOCKED_SAFETY' | 'REVOKED';
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-9941',
    timestamp: '2026-08-31 14:22:10 UTC',
    actorRole: 'CLINICIAN',
    actorIdentifier: 'Dr. Wanjiru Mwangi (KMPDC/A49281)',
    actionType: 'RECORD_VERIFIED',
    targetResource: 'Mother MOH-216 Profile #MOM-84920 / ANC Visit 3',
    sha256Signature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ipHash: '197.237.12.*** (Nairobi)',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9940',
    timestamp: '2026-08-31 13:58:04 UTC',
    actorRole: 'SYSTEM_INTERCEPTOR',
    actorIdentifier: 'Layer 1 Deterministic Engine',
    actionType: 'PRESCRIPTION_BLOCKED',
    targetResource: 'Chat Prompt: Amoxicillin 500mg Dosing Query',
    sha256Signature: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    ipHash: '102.135.24.*** (Mombasa)',
    status: 'BLOCKED_SAFETY'
  },
  {
    id: 'AUD-9939',
    timestamp: '2026-08-31 12:45:19 UTC',
    actorRole: 'CLINICIAN',
    actorIdentifier: 'Faith Chebet Otieno (NCK/RN-88219)',
    actionType: 'SESSION_INITIALIZED',
    targetResource: 'Ephemeral Clinician Access Window (15 min window)',
    sha256Signature: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    ipHash: '41.89.227.*** (Nakuru)',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9938',
    timestamp: '2026-08-31 11:10:00 UTC',
    actorRole: 'ADMIN',
    actorIdentifier: 'Admin Lead (admin_super_01)',
    actionType: 'CLINICIAN_CREDENTIALED',
    targetResource: 'Clinician Registration: Faith Chebet Otieno (NCK/RN-88219)',
    sha256Signature: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
    ipHash: '196.201.214.*** (Nairobi)',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9937',
    timestamp: '2026-08-31 09:30:12 UTC',
    actorRole: 'MOTHER',
    actorIdentifier: 'Mother Profile #MOM-84920',
    actionType: 'DATA_EXPORT_REQUEST',
    targetResource: 'MOH 216 Complete Digital PDF Summary',
    sha256Signature: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    ipHash: '105.163.1.*** (Kisumu)',
    status: 'SUCCESS'
  }
];

export const PlatformAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = logs.filter(l => {
    const matchesSearch = l.actorIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.targetResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.sha256Signature.includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || l.actorRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const exportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      ['ID,Timestamp,Actor Role,Actor,Action,Target Resource,SHA256 Signature,Status']
      .concat(filtered.map(l => `"${l.id}","${l.timestamp}","${l.actorRole}","${l.actorIdentifier}","${l.actionType}","${l.targetResource}","${l.sha256Signature}","${l.status}"`))
      .join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `momhaven_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Immutable Records</span>
            <Lock className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</p>
          <p className="text-xs text-teal-600 mt-1">SHA-256 Checksum Verified</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Clinician Verifications</span>
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {logs.filter(l => l.actionType === 'RECORD_VERIFIED').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">MOH 216 Signed Entries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Safety Interceptions</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {logs.filter(l => l.status === 'BLOCKED_SAFETY').length}
          </p>
          <p className="text-xs text-rose-600 mt-1">Prescription attempts prevented</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Compliance Retention</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">7 Years</p>
          <p className="text-xs text-amber-600 mt-1">MOH Medical Records Mandate</p>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by actor, resource, or SHA signature..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Roles</option>
              <option value="CLINICIAN">Clinician</option>
              <option value="ADMIN">Admin</option>
              <option value="MOTHER">Mother</option>
              <option value="SYSTEM_INTERCEPTOR">Safety Interceptor</option>
            </select>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Audit ID & Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action & Resource</th>
                <th className="py-3.5 px-4">SHA-256 Hash</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4 font-mono">
                    <span className="font-bold text-gray-900">{log.id}</span>
                    <div className="text-[11px] text-gray-500">{log.timestamp}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-medium text-[10px]">
                      {log.actorRole}
                    </span>
                    <div className="text-xs font-semibold text-gray-900 mt-1">{log.actorIdentifier}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{log.ipHash}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{log.actionType}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{log.targetResource}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-[10px] text-gray-500 max-w-xs truncate" title={log.sha256Signature}>
                    {log.sha256Signature.substring(0, 24)}...
                  </td>
                  <td className="py-4 px-4 text-right">
                    {log.status === 'SUCCESS' && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px]">
                        SUCCESS
                      </span>
                    )}
                    {log.status === 'BLOCKED_SAFETY' && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full font-bold text-[11px]">
                        BLOCKED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
