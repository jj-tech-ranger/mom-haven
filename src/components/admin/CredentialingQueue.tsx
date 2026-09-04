// src/components/admin/CredentialingQueue.tsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, ShieldCheck, Search, Filter, 
  ExternalLink, FileText, UserCheck, AlertTriangle, Building2, Phone, Award, RefreshCw
} from 'lucide-react';
import { auth } from '../../lib/firebase';

export interface ClinicianProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cadre: 'OBSTETRICIAN' | 'MIDWIFE' | 'CLINICAL_OFFICER' | 'NURSE' | 'PEDIATRICIAN';
  licenseNumber: string; // e.g. KMPDC/A49281, NCK/RN-88219
  boardName: string;
  facilityAffiliation: string;
  county: string;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  submissionDate: string;
  verificationAuditDate?: string;
  verifierAdminId?: string;
  rejectionReason?: string;
  documents: {
    licenseDocUrl?: string;
    idDocUrl?: string;
  };
}

const INITIAL_CLINICIANS: ClinicianProfile[] = [
  {
    id: 'clin_001',
    fullName: 'Dr. Wanjiru Mwangi',
    email: 'dr.wanjiru@pumwani.go.ke',
    phone: '+254 712 345 678',
    cadre: 'OBSTETRICIAN',
    licenseNumber: 'KMPDC/A49281',
    boardName: 'Kenya Medical Practitioners & Dentists Council (KMPDC)',
    facilityAffiliation: 'Pumwani Maternity Hospital (KMHFL #13125)',
    county: 'Nairobi',
    status: 'ACTIVE',
    submissionDate: '2026-08-10',
    verificationAuditDate: '2026-08-11',
    verifierAdminId: 'admin_super_01',
    documents: {
      licenseDocUrl: '#kmpdc-cert',
      idDocUrl: '#id-doc'
    }
  },
  {
    id: 'clin_002',
    fullName: 'Faith Chebet Otieno, RN',
    email: 'faith.chebet@nakuru.go.ke',
    phone: '+254 722 890 123',
    cadre: 'MIDWIFE',
    licenseNumber: 'NCK/RN-88219',
    boardName: 'Nursing Council of Kenya (NCK)',
    facilityAffiliation: 'Nakuru Level 5 Hospital (KMHFL #15320)',
    county: 'Nakuru',
    status: 'PENDING_REVIEW',
    submissionDate: '2026-08-28',
    documents: {
      licenseDocUrl: '#nck-cert',
      idDocUrl: '#id-doc'
    }
  },
  {
    id: 'clin_003',
    fullName: 'Dr. Brian Ochieng',
    email: 'brian.ochieng@jaramogi.go.ke',
    phone: '+254 733 456 789',
    cadre: 'PEDIATRICIAN',
    licenseNumber: 'KMPDC/B31980',
    boardName: 'Kenya Medical Practitioners & Dentists Council (KMPDC)',
    facilityAffiliation: 'Jaramogi Oginga Odinga Teaching & Referral (KMHFL #13982)',
    county: 'Kisumu',
    status: 'PENDING_REVIEW',
    submissionDate: '2026-08-29',
    documents: {
      licenseDocUrl: '#kmpdc-cert',
      idDocUrl: '#id-doc'
    }
  },
  {
    id: 'clin_004',
    fullName: 'Mercy Nyaboke, CO',
    email: 'mnyaboke@machakos.go.ke',
    phone: '+254 701 223 344',
    cadre: 'CLINICAL_OFFICER',
    licenseNumber: 'COC/REG-40192',
    boardName: 'Clinical Officers Council (COC)',
    facilityAffiliation: 'Machakos Level 5 Hospital (KMHFL #14210)',
    county: 'Machakos',
    status: 'ACTIVE',
    submissionDate: '2026-07-15',
    verificationAuditDate: '2026-07-16',
    verifierAdminId: 'admin_super_01',
    documents: {
      licenseDocUrl: '#coc-cert',
      idDocUrl: '#id-doc'
    }
  },
  {
    id: 'clin_005',
    fullName: 'Dennis Mutua',
    email: 'dmutua@temphealth.org',
    phone: '+254 799 112 233',
    cadre: 'CLINICAL_OFFICER',
    licenseNumber: 'COC/EXP-00211',
    boardName: 'Clinical Officers Council (COC)',
    facilityAffiliation: 'Private Clinic',
    county: 'Mombasa',
    status: 'SUSPENDED',
    submissionDate: '2026-06-01',
    rejectionReason: 'Expired license documentation pending renewal validation with COC register.',
    documents: {
      licenseDocUrl: '#coc-cert-exp'
    }
  }
];

export const CredentialingQueue: React.FC = () => {
  const [clinicians, setClinicians] = useState<ClinicianProfile[]>(INITIAL_CLINICIANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedClinician, setSelectedClinician] = useState<ClinicianProfile | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'APPROVE' | 'REJECT' | 'SUSPEND'; clinician: ClinicianProfile } | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchClinicians = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken(true) : '';
      if (!idToken) return;
      const res = await fetch('/api/v1/admin/clinicians', {
        headers: {
          authorization: `Bearer ${idToken}`,
          'x-firebase-id-token': idToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          const serverProfiles: ClinicianProfile[] = data.items.map((item: any) => {
            let status: ClinicianProfile['status'] = 'PENDING_REVIEW';
            const s = String(item.verificationStatus || '').toLowerCase();
            if (s === 'approved') status = 'ACTIVE';
            else if (s === 'rejected') status = 'REJECTED';
            else if (s === 'suspended') status = 'SUSPENDED';
            else status = 'PENDING_REVIEW';

            return {
              id: item.id || item.uid,
              fullName: item.displayName || item.name || 'Healthcare Provider',
              email: item.email || '',
              phone: item.phone || '',
              cadre: (item.cadre || 'Clinical Officer').toUpperCase(),
              licenseNumber: item.licenseNumber || 'PENDING',
              boardName: item.boardName || 'Regulatory Board',
              facilityAffiliation: item.facilityName || 'Health Facility',
              county: item.county || 'National',
              status,
              submissionDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              rejectionReason: item.rejectionReason,
              documents: item.documents || {},
            };
          });
          const serverIds = new Set(serverProfiles.map(p => p.id));
          const nonDuplicatedDemo = INITIAL_CLINICIANS.filter(c => !serverIds.has(c.id));
          setClinicians([...serverProfiles, ...nonDuplicatedDemo]);
        }
      }
    } catch (err) {
      console.warn('Failed to load server clinicians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicians();
  }, []);

  const filtered = clinicians.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.facilityAffiliation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      setProcessing(true);
      setActionError(null);
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken(true) : '';
      if (idToken) {
        const res = await fetch(`/api/v1/admin/clinician/${id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${idToken}`,
            'x-firebase-id-token': idToken,
          },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to approve clinician on server.');
        }
      }
      setClinicians(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'ACTIVE',
            verificationAuditDate: new Date().toISOString().split('T')[0],
            verifierAdminId: user?.uid || 'admin_super_01'
          };
        }
        return c;
      }));
      setActionModal(null);
    } catch (e: any) {
      setActionError(e?.message || 'Failed to approve clinician.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrSuspend = async (id: string, newStatus: 'REJECTED' | 'SUSPENDED', reason: string) => {
    try {
      setProcessing(true);
      setActionError(null);
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken(true) : '';
      if (idToken) {
        const endpoint = newStatus === 'REJECTED'
          ? `/api/v1/admin/clinician/${id}/reject`
          : `/api/v1/admin/clinician/${id}/suspend`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${idToken}`,
            'x-firebase-id-token': idToken,
          },
          body: JSON.stringify({ reason }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to ${newStatus.toLowerCase()} clinician on server.`);
        }
      }
      setClinicians(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: newStatus,
            rejectionReason: reason || 'Failed regulatory compliance requirements.'
          };
        }
        return c;
      }));
      setActionModal(null);
      setReasonInput('');
    } catch (e: any) {
      setActionError(e?.message || `Failed to update clinician status.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Review</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {clinicians.filter(c => c.status === 'PENDING_REVIEW').length}
          </p>
          <p className="text-xs text-amber-600 mt-1">Requires regulatory board lookup</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Active Clinicians</span>
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {clinicians.filter(c => c.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-teal-600 mt-1">Cryptographically authorized signers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Suspended / Rejected</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {clinicians.filter(c => c.status === 'SUSPENDED' || c.status === 'REJECTED').length}
          </p>
          <p className="text-xs text-rose-600 mt-1">Access revoked / Expired licenses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Recognized Boards</span>
            <Award className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">3 Boards</p>
          <p className="text-xs text-gray-500 mt-1">KMPDC • NCK • COC</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by clinician name, license number, or hospital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="ACTIVE">Active Authorized</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table of Clinicians */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Clinician & Cadre</th>
                <th className="py-3.5 px-4">Regulatory License</th>
                <th className="py-3.5 px-4">Primary Facility</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(clinician => (
                <tr key={clinician.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{clinician.fullName}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-mono text-[11px]">
                        {clinician.cadre}
                      </span>
                      <span>{clinician.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded inline-block">
                      {clinician.licenseNumber}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{clinician.boardName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs font-medium text-gray-800">{clinician.facilityAffiliation}</div>
                    <div className="text-[11px] text-gray-500">{clinician.county} County</div>
                  </td>
                  <td className="py-4 px-4">
                    {clinician.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Active
                      </span>
                    )}
                    {clinician.status === 'PENDING_REVIEW' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Under Review
                      </span>
                    )}
                    {clinician.status === 'SUSPENDED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Suspended
                      </span>
                    )}
                    {clinician.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5 text-gray-500" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedClinician(clinician)}
                        className="p-1.5 text-gray-600 hover:text-teal-700 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" /> Inspect
                      </button>

                      {clinician.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => setActionModal({ type: 'APPROVE', clinician })}
                            className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ type: 'REJECT', clinician })}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {clinician.status === 'ACTIVE' && (
                        <button
                          onClick={() => setActionModal({ type: 'SUSPEND', clinician })}
                          className="px-2 py-1 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Clinician Detail Modal */}
      {selectedClinician && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{selectedClinician.fullName}</h3>
                  <p className="text-xs text-gray-500">{selectedClinician.cadre} • {selectedClinician.boardName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClinician(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <span className="text-gray-500 block">License / Registration</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{selectedClinician.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status</span>
                  <span className="font-semibold text-teal-800">{selectedClinician.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Contact Phone</span>
                  <span className="font-medium text-gray-900">{selectedClinician.phone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Email Address</span>
                  <span className="font-medium text-gray-900">{selectedClinician.email}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" /> Facility Affiliation
                </div>
                <p className="text-gray-700">{selectedClinician.facilityAffiliation}</p>
                <p className="text-gray-500">County Jurisdiction: {selectedClinician.county} County</p>
              </div>

              {selectedClinician.rejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
                  <span className="font-bold block mb-1">Administrative Note / Suspension Reason:</span>
                  {selectedClinician.rejectionReason}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedClinician(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject / Suspend Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-gray-900 text-base mb-2">
              {actionModal.type === 'APPROVE' && 'Confirm Clinician Credential Approval'}
              {actionModal.type === 'REJECT' && 'Reject Clinician Credential Application'}
              {actionModal.type === 'SUSPEND' && 'Suspend Clinician Digital Verification Key'}
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              {actionModal.type === 'APPROVE' && `Are you sure you want to authorize ${actionModal.clinician.fullName} (${actionModal.clinician.licenseNumber})? This grants cryptographic MOH-216 verification signing authority.`}
              {actionModal.type === 'REJECT' && `Please enter the rationale for rejecting ${actionModal.clinician.fullName}'s application:`}
              {actionModal.type === 'SUSPEND' && `Suspending ${actionModal.clinician.fullName} will immediately invalidate their active 15-minute clinical session tokens.`}
            </p>

            {actionModal.type !== 'APPROVE' && (
              <textarea
                placeholder="Enter mandatory audit reason..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-600"
                rows={3}
              />
            )}

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs mb-3">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setActionModal(null); setReasonInput(''); setActionError(null); }}
                disabled={processing}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              {actionModal.type === 'APPROVE' && (
                <button
                  onClick={() => handleApprove(actionModal.clinician.id)}
                  disabled={processing}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {processing ? 'Authorizing...' : 'Confirm & Issue Authorization'}
                </button>
              )}
              {actionModal.type === 'REJECT' && (
                <button
                  onClick={() => handleRejectOrSuspend(actionModal.clinician.id, 'REJECTED', reasonInput)}
                  disabled={processing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              )}
              {actionModal.type === 'SUSPEND' && (
                <button
                  onClick={() => handleRejectOrSuspend(actionModal.clinician.id, 'SUSPENDED', reasonInput)}
                  disabled={processing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {processing ? 'Suspending...' : 'Suspend Clinician'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
