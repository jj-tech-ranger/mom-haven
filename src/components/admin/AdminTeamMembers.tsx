// src/components/admin/AdminTeamMembers.tsx
import React, { useState } from 'react';
import { 
  Users, UserCheck, Shield, Plus, Mail, Phone, 
  MoreVertical, CheckCircle2, Lock, Trash2
} from 'lucide-react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'CLINICAL_GOVERNANCE_OFFICER' | 'DATA_PROTECTION_OFFICER' | 'CONTENT_EDITOR';
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  lastLogin: string;
}

const INITIAL_TEAM: AdminUser[] = [
  {
    id: 'adm_01',
    name: 'Dr. Amina Hassan',
    email: 'amina.hassan@momhaven.go.ke',
    phone: '+254 722 100 200',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 15:40 UTC'
  },
  {
    id: 'adm_02',
    name: 'Dr. Wanjiru Mwangi',
    email: 'wanjiru.m@momhaven.go.ke',
    phone: '+254 712 345 678',
    role: 'CLINICAL_GOVERNANCE_OFFICER',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 14:10 UTC'
  },
  {
    id: 'adm_03',
    name: 'Kariuki Ndegwa, Advocate',
    email: 'kndegwa@momhaven.go.ke',
    phone: '+254 733 888 777',
    role: 'DATA_PROTECTION_OFFICER',
    status: 'ACTIVE',
    lastLogin: '2026-08-30 09:20 UTC'
  },
  {
    id: 'adm_04',
    name: 'Grace Akinyi',
    email: 'gakinyi@momhaven.go.ke',
    phone: '+254 701 444 555',
    role: 'CONTENT_EDITOR',
    status: 'ACTIVE',
    lastLogin: '2026-08-29 11:00 UTC'
  }
];

export const AdminTeamMembers: React.FC = () => {
  const [team, setTeam] = useState<AdminUser[]>(INITIAL_TEAM);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<AdminUser>>({
    role: 'CLINICAL_GOVERNANCE_OFFICER',
    status: 'INVITED'
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const member: AdminUser = {
      id: 'adm_' + Date.now(),
      name: newMember.name || '',
      email: newMember.email || '',
      phone: newMember.phone || '+254 700 000 000',
      role: (newMember.role as any) || 'CLINICAL_GOVERNANCE_OFFICER',
      status: 'INVITED',
      lastLogin: 'Pending Invitation Accept'
    };

    setTeam([...team, member]);
    setIsInviteOpen(false);
    setNewMember({ role: 'CLINICAL_GOVERNANCE_OFFICER', status: 'INVITED' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Access Control & Governance Board</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Platform Administrative Team</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Scoped role-based administrative access for clinical oversight, data compliance, and editorial reviews.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Invite Admin Member
        </button>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Member Name & Email</th>
                <th className="py-3.5 px-4">Governance Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team.map(member => (
                <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-900 text-sm">{member.name}</div>
                    <div className="text-gray-500 flex items-center gap-2 mt-0.5">
                      <Mail className="w-3 h-3" /> {member.email}
                      <span>•</span>
                      <Phone className="w-3 h-3" /> {member.phone}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg font-bold font-mono text-[11px]">
                      {member.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {member.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-semibold">
                        Invited
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-500 font-mono text-[11px]">
                    {member.lastLogin}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setTeam(team.filter(t => t.id !== member.id))}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">Invite Governance Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Kamau"
                  value={newMember.name || ''}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@health.go.ke"
                  value={newMember.email || ''}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+254 700 000 000"
                  value={newMember.phone || ''}
                  onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Administrative Role</label>
                <select
                  value={newMember.role}
                  onChange={e => setNewMember({ ...newMember, role: e.target.value as any })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                >
                  <option value="CLINICAL_GOVERNANCE_OFFICER">Clinical Governance Officer (Rule sign-off)</option>
                  <option value="DATA_PROTECTION_OFFICER">Data Protection Officer (DPA 2019 audits)</option>
                  <option value="CONTENT_EDITOR">Content Editor (Nutrition & Superfoods)</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full platform access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
