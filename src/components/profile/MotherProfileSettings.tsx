import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Lock, 
  Share2, 
  Download, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  Smartphone, 
  Copy,
  ChevronRight,
  HeartHandshake,
  Clock,
  Bell,
  Globe,
  Trash2,
  AlertTriangle,
  Heart,
  Truck,
  Phone,
  Calendar,
  Sparkles,
  Loader2,
  Check,
  Building2,
  MapPin,
  Edit3
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { KENYA_COUNTIES } from '../../types';
import { KENYA_KMHFL_FACILITIES } from '../../services/clinicianService';
import { 
  getMotherPartnerRelationships, 
  getMotherPartnerRelationship,
  updatePartnerSharingScopesById, 
  revokePartnerAccess, 
  PartnerRelationship, 
  PartnerSharingScopes,
  DEFAULT_SHARING_SCOPES 
} from '../../services/sharingService';
import { getHealthContext, saveHealthContext } from '../../services/healthContextService';
import { 
  requestNotificationPermissionAndToken, 
  showLocalSystemNotification, 
  triggerProcessDueReminders 
} from '../../services/notificationDeliveryService';
import { LanguageToggle } from '../LanguageToggle';
import Button from '../Button';

interface MotherProfileSettingsProps {
  userId?: string;
  motherName?: string;
  email?: string;
  phone?: string;
  county?: string;
  onOpenPinSetup: () => void;
  onOpenPartnerShare: () => void;
  onOpenExportData: () => void;
  onSignOut: () => void;
}

export default function MotherProfileSettings({
  userId,
  motherName = 'Mama',
  email = '',
  phone: propPhone,
  county: propCounty,
  onOpenPinSetup,
  onOpenPartnerShare,
  onOpenExportData,
  onSignOut,
}: MotherProfileSettingsProps) {
  const [partnerInviteCode, setPartnerInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(propPhone || '');
  const [county, setCounty] = useState(propCounty || '');
  const [primaryHospitalFacilityId, setPrimaryHospitalFacilityId] = useState('');
  const [primaryHospitalName, setPrimaryHospitalName] = useState('');

  // Residence edit state
  const [isEditingResidence, setIsEditingResidence] = useState(false);
  const [editCounty, setEditCounty] = useState(propCounty || 'Nairobi');
  const [editHospitalId, setEditHospitalId] = useState('');
  const [editHospitalName, setEditHospitalName] = useState('');
  const [savingResidence, setSavingResidence] = useState(false);
  const [residenceNotice, setResidenceNotice] = useState<string | null>(null);

  // Connected Partners State (Audit P6.1, P7.2)
  const [partners, setPartners] = useState<PartnerRelationship[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [updatingScopeKey, setUpdatingScopeKey] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Daily Check-in Reminder Settings (Audit P6.1)
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderSavedNotice, setReminderSavedNotice] = useState(false);

  // Push & Delivery Notification Settings (Prompt 2.1)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [testingNotification, setTestingNotification] = useState(false);
  const [checkingDueReminders, setCheckingDueReminders] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const loadPartners = useCallback(async (uid: string) => {
    try {
      setLoadingPartners(true);
      const list = await getMotherPartnerRelationships(uid);
      if (list.length > 0) {
        setPartners(list);
        const activeOrPending = list.find(r => r.status === 'active' || r.status === 'pending');
        if (activeOrPending?.connectionCode) {
          setPartnerInviteCode(activeOrPending.connectionCode);
        }
      } else {
        const single = await getMotherPartnerRelationship(uid);
        if (single) {
          setPartners([single]);
          if (single.connectionCode) setPartnerInviteCode(single.connectionCode);
        } else {
          setPartners([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load partner relationships', err);
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    // Fetch user document for phone, county, and checkInReminders
    getDoc(doc(db, 'users', userId))
      .then((snap) => {
        if (!isMounted || !snap.exists()) return;
        const data = snap.data();
        if (data?.phone) setPhone(data.phone);
        if (data?.county) {
          setCounty(data.county);
          setEditCounty(data.county);
        }
        if (data?.checkInReminders) {
          if (typeof data.checkInReminders.enabled === 'boolean') {
            setRemindersEnabled(data.checkInReminders.enabled);
          }
          if (data.checkInReminders.time) {
            setReminderTime(data.checkInReminders.time);
          }
        }
      })
      .catch(() => {});

    // Fetch motherProfiles document for residence and primary hospital
    getDoc(doc(db, 'motherProfiles', userId))
      .then((snap) => {
        if (!isMounted || !snap.exists()) return;
        const data = snap.data();
        if (data?.county) {
          setCounty(data.county);
          setEditCounty(data.county);
        }
        if (data?.primaryHospitalFacilityId) {
          setPrimaryHospitalFacilityId(data.primaryHospitalFacilityId);
          setEditHospitalId(data.primaryHospitalFacilityId);
        }
        if (data?.primaryHospitalName) {
          setPrimaryHospitalName(data.primaryHospitalName);
          setEditHospitalName(data.primaryHospitalName);
        }
      })
      .catch(() => {});

    // Also check health context for county and primary hospital
    getHealthContext(userId)
      .then((ctx) => {
        if (!isMounted || !ctx) return;
        const resolvedCounty = ctx.location?.county || ctx.county;
        if (resolvedCounty) {
          setCounty(resolvedCounty);
          setEditCounty(resolvedCounty);
        }
        const resolvedHId = ctx.location?.primaryHospitalFacilityId || ctx.primaryHospitalFacilityId;
        const resolvedHName = ctx.location?.primaryHospitalName || ctx.primaryHospitalName;
        if (resolvedHId) {
          setPrimaryHospitalFacilityId(prev => prev || resolvedHId);
          setEditHospitalId(prev => prev || resolvedHId);
        }
        if (resolvedHName) {
          setPrimaryHospitalName(prev => prev || resolvedHName);
          setEditHospitalName(prev => prev || resolvedHName);
        }
      })
      .catch(() => {});

    loadPartners(userId);

    return () => { isMounted = false; };
  }, [userId, loadPartners]);

  // Filter KMHFL facilities by editCounty
  const editAvailableHospitals = React.useMemo(() => {
    return KENYA_KMHFL_FACILITIES.filter(
      f => f.county.trim().toLowerCase() === editCounty.trim().toLowerCase()
    );
  }, [editCounty]);

  const handleEditCountyChange = (newCounty: string) => {
    setEditCounty(newCounty);
    // If county changes, clear hospital if it doesn't belong to the newly selected county
    if (editHospitalId) {
      const match = KENYA_KMHFL_FACILITIES.find(
        f => f.code === editHospitalId && f.county.trim().toLowerCase() === newCounty.trim().toLowerCase()
      );
      if (!match) {
        setEditHospitalId('');
        setEditHospitalName('');
      }
    }
  };

  const handleSaveResidence = async () => {
    if (!userId) return;
    try {
      setSavingResidence(true);
      setResidenceNotice(null);

      // Save to motherProfiles
      await setDoc(doc(db, 'motherProfiles', userId), {
        userId,
        county: editCounty,
        primaryHospitalFacilityId: editHospitalId || null,
        primaryHospitalName: editHospitalName || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Update user document
      await updateDoc(doc(db, 'users', userId), {
        county: editCounty,
      });

      // Update healthContext
      await saveHealthContext(userId, {
        county: editCounty,
        primaryHospitalFacilityId: editHospitalId || undefined,
        primaryHospitalName: editHospitalName || undefined,
        location: {
          county: editCounty,
          primaryHospitalFacilityId: editHospitalId || undefined,
          primaryHospitalName: editHospitalName || undefined,
        },
      }, 'profile_edit');

      setCounty(editCounty);
      setPrimaryHospitalFacilityId(editHospitalId);
      setPrimaryHospitalName(editHospitalName);
      setIsEditingResidence(false);
      setResidenceNotice('Residence and primary hospital updated successfully.');
      setTimeout(() => setResidenceNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to update residence', err);
      setResidenceNotice('Failed to update residence. Please try again.');
    } finally {
      setSavingResidence(false);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`Join my MomHaven pregnancy support circle with invite code: ${partnerInviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (err) {
      console.error('Logout error', err);
      onSignOut();
    }
  };

  // Toggle individual scope for a partner (P6.1)
  const handleToggleScope = async (
    partnerRel: PartnerRelationship,
    scopeKey: keyof PartnerSharingScopes
  ) => {
    const currentScopes: PartnerSharingScopes = partnerRel.sharingScopes || DEFAULT_SHARING_SCOPES;
    const nextVal = !currentScopes[scopeKey];
    const newScopes: PartnerSharingScopes = {
      ...currentScopes,
      [scopeKey]: nextVal,
    };

    // Optimistic update
    setPartners(prev => prev.map(p => p.id === partnerRel.id ? { ...p, sharingScopes: newScopes } : p));
    setUpdatingScopeKey(`${partnerRel.id}_${scopeKey}`);

    try {
      await updatePartnerSharingScopesById(partnerRel.id, { [scopeKey]: nextVal });
    } catch (err) {
      console.error('Failed to update scope', err);
      // Revert on error
      setPartners(prev => prev.map(p => p.id === partnerRel.id ? { ...p, sharingScopes: currentScopes } : p));
    } finally {
      setUpdatingScopeKey(null);
    }
  };

  // Revoke partner access (P7.2)
  const handleRevokePartner = async (relationshipId: string) => {
    try {
      setIsRevoking(true);
      await revokePartnerAccess(relationshipId);
      // Immediately reflect revoked status
      setPartners(prev => prev.map(p => p.id === relationshipId ? { ...p, status: 'revoked' } : p));
      setConfirmRevokeId(null);
    } catch (err) {
      console.error('Failed to revoke partner access', err);
    } finally {
      setIsRevoking(false);
    }
  };

  // Persist check-in reminders (P6.1) & register push notifications (Prompt 2.1)
  const handleSaveReminders = async (enabled: boolean, time: string) => {
    setRemindersEnabled(enabled);
    setReminderTime(time);
    if (!userId) return;

    // If mother is enabling reminders and hasn't granted notifications yet, prompt for device permission
    if (enabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      handleEnablePushNotifications();
    }

    try {
      setSavingReminder(true);
      await updateDoc(doc(db, 'users', userId), {
        checkInReminders: {
          enabled,
          time,
          updatedAt: new Date().toISOString(),
        },
      });
      setReminderSavedNotice(true);
      setTimeout(() => setReminderSavedNotice(false), 2500);
    } catch (err) {
      console.warn('Could not save checkInReminders preference', err);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!userId) return;
    setPushLoading(true);
    setPushStatusMessage(null);
    try {
      const res = await requestNotificationPermissionAndToken(userId);
      const currentPerm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
      setPushPermission(currentPerm);
      if (res.granted) {
        if (res.token) {
          setPushStatusMessage('Device push notifications enabled and FCM token registered!');
        } else {
          setPushStatusMessage('System notifications enabled locally! (To activate FCM cloud pushes in production, provide VAPID key in settings).');
        }
      } else if (currentPerm === 'denied') {
        setPushStatusMessage('Notifications are blocked by your browser settings. Please allow notifications in site settings.');
      } else if (res.error) {
        setPushStatusMessage(res.error);
      }
    } catch (err: any) {
      setPushStatusMessage(err?.message || 'Could not register push notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestingNotification(true);
    try {
      await showLocalSystemNotification({
        title: 'MomHaven Clinical Reminder',
        body: 'Upcoming ANC / KEPI vaccine window reminder from your personalized schedule.',
        deepLink: 'today',
      });
      setPushStatusMessage('Test notification dispatched to your device!');
    } catch (err: any) {
      setPushStatusMessage(err?.message || 'Could not display test notification.');
    } finally {
      setTestingNotification(false);
    }
  };

  const handleTriggerProcessDue = async () => {
    setCheckingDueReminders(true);
    try {
      const result = await triggerProcessDueReminders();
      if (result.success) {
        setPushStatusMessage(`Due reminders checked! ${result.notifiedCount || 0} push notifications dispatched.`);
      } else {
        setPushStatusMessage(`Server check completed: ${result.error || 'No pending due reminders'}`);
      }
    } catch (err: any) {
      setPushStatusMessage(err?.message || 'Failed to trigger due reminder check.');
    } finally {
      setCheckingDueReminders(false);
    }
  };

  const activePartners = partners.filter(p => p.status === 'active');
  const otherPartners = partners.filter(p => p.status !== 'active');

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-[26px] p-6 border border-[var(--border-hairline)] shadow-card-1 text-center space-y-3">
        <div className="w-18 h-18 rounded-full bg-[var(--lavender-100)] border-2 border-[var(--haven-orchid)]/30 mx-auto flex items-center justify-center text-[var(--haven-deep)] font-display font-extrabold text-[24px]">
          {motherName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2 className="font-display font-black text-[20px] text-[var(--ink-900)]">
            {motherName}
          </h2>
          <p className="text-[13px] text-[var(--ink-600)] font-body">
            {email}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-display font-bold">
              <MapPin className="w-3 h-3" />
              County: {county || 'Not set'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[11px] font-display font-bold max-w-full">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{primaryHospitalName || 'No primary hospital selected'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Residence & Health Facility Section */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                Residence &amp; Primary Hospital
              </h3>
              <p className="text-[11px] text-[var(--ink-600)]">
                County of residence and optional delivery hospital
              </p>
            </div>
          </div>
          {!isEditingResidence && (
            <button
              type="button"
              onClick={() => {
                setEditCounty(county || 'Nairobi');
                setEditHospitalId(primaryHospitalFacilityId);
                setEditHospitalName(primaryHospitalName);
                setIsEditingResidence(true);
              }}
              className="px-3 py-1.5 rounded-full border border-[var(--border-hairline)] hover:bg-[var(--surface-2)] text-xs font-display font-bold text-[var(--haven-deep)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        {residenceNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{residenceNotice}</span>
          </div>
        )}

        {!isEditingResidence ? (
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-hairline)]">
              <span className="text-xs text-[var(--ink-500)] block mb-0.5">County of Residence</span>
              <strong className="font-display font-bold text-[var(--ink-900)] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[var(--haven-orchid)]" />
                {county ? `${county} County` : 'Not specified'}
              </strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-hairline)]">
              <span className="text-xs text-[var(--ink-500)] block mb-0.5">Primary Hospital / Facility</span>
              <strong className="font-display font-bold text-[var(--ink-900)] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[var(--haven-deep)] shrink-0" />
                <span className="truncate">{primaryHospitalName || 'None selected (Optional)'}</span>
              </strong>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-display font-bold text-[var(--ink-900)] mb-1">
                County of Residence (Kenya)
              </label>
              <select
                value={editCounty}
                onChange={e => handleEditCountyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-white text-sm focus:outline-none focus:border-[var(--haven-orchid)] cursor-pointer"
              >
                {KENYA_COUNTIES.map(c => (
                  <option key={c} value={c}>{c} County</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-[var(--ink-900)] mb-1">
                Primary Hospital / Health Facility <span className="font-normal text-[var(--ink-500)]">(Optional)</span>
              </label>
              <select
                value={editHospitalId}
                onChange={e => {
                  const val = e.target.value;
                  setEditHospitalId(val);
                  const found = KENYA_KMHFL_FACILITIES.find(f => f.code === val);
                  setEditHospitalName(found ? found.name : '');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-white text-sm focus:outline-none focus:border-[var(--haven-orchid)] cursor-pointer"
              >
                <option value="">None / Select later</option>
                {editAvailableHospitals.map(f => (
                  <option key={f.code} value={f.code}>
                    {f.name} ({f.level})
                  </option>
                ))}
              </select>
              {editAvailableHospitals.length === 0 ? (
                <p className="text-[11px] text-[var(--ink-500)] mt-1">
                  No catalogued KMHFL facilities listed for {editCounty} County.
                </p>
              ) : (
                <p className="text-[11px] text-[var(--ink-500)] mt-1">
                  Hospitals are filtered to {editCounty} County.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setIsEditingResidence(false)}
                disabled={savingResidence}
                className="px-4 py-2 rounded-full border border-[var(--border-hairline)] text-xs font-display font-bold text-[var(--ink-700)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveResidence}
                disabled={savingResidence}
                className="px-5 py-2 text-xs"
              >
                {savingResidence ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Language / Lugha Section (Audit §13.7) */}
      <div className="bg-white rounded-[24px] p-4 border border-[var(--border-hairline)] shadow-card-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Language / Lugha
            </h4>
            <p className="text-[12px] text-[var(--ink-600)]">
              English or Kiswahili translation
            </p>
          </div>
        </div>
        <LanguageToggle />
      </div>

      {/* Sharing & Privacy Section (Audit P6.1, §8, §13.6) */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[var(--haven-deep)] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                Sharing &amp; Privacy
              </h3>
              <p className="text-[11px] text-[var(--ink-600)]">
                Control exactly what your support partner can see
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPartnerShare}
            className="text-[11px] font-display font-bold text-[var(--haven-deep)] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] px-3 py-1.5 rounded-full border border-purple-200 transition-colors cursor-pointer"
          >
            Invite Code
          </button>
        </div>

        {/* Connected Partners List */}
        {loadingPartners ? (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-[var(--ink-600)]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--haven-deep)]" />
            <span>Loading sharing settings...</span>
          </div>
        ) : activePartners.length > 0 ? (
          <div className="space-y-4">
            {activePartners.map((partner) => {
              const scopes: PartnerSharingScopes = partner.sharingScopes || DEFAULT_SHARING_SCOPES;
              const connectedDate = partner.connectedAt 
                ? new Date(partner.connectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Active partner';

              return (
                <div
                  key={partner.id}
                  className="bg-[var(--lavender-50)]/70 rounded-[20px] p-4 border border-[var(--border-hairline)] space-y-3.5"
                >
                  {/* Partner Identity Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-purple-200/80 text-[var(--haven-deep)] flex items-center justify-center font-display font-bold text-sm">
                        {(partner.partnerName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                            {partner.partnerName || 'Support Partner'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ink-600)]">
                          Connected since {connectedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Scope Toggles List */}
                  <div className="bg-white rounded-[16px] p-3 border border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]">
                    {/* 1. Logistics */}
                    <div className="flex items-center justify-between py-2.5 first:pt-1">
                      <div className="flex items-center gap-2.5 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-[12px] text-[var(--ink-900)]">
                            Logistics &amp; Transport
                          </p>
                          <p className="text-[10px] text-[var(--ink-600)]">
                            Hospital choice, taxi numbers, and bag checklist
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={scopes.logistics}
                        disabled={updatingScopeKey === `${partner.id}_logistics`}
                        onClick={() => handleToggleScope(partner, 'logistics')}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          scopes.logistics ? 'bg-[var(--haven-deep)]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            scopes.logistics ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 2. Emergency Contacts */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-[12px] text-[var(--ink-900)]">
                            Emergency Contacts &amp; Facility
                          </p>
                          <p className="text-[10px] text-[var(--ink-600)]">
                            Maternity emergency hotlines and saved contacts
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={scopes.emergencyContacts}
                        disabled={updatingScopeKey === `${partner.id}_emergencyContacts`}
                        onClick={() => handleToggleScope(partner, 'emergencyContacts')}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          scopes.emergencyContacts ? 'bg-[var(--haven-deep)]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            scopes.emergencyContacts ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 3. Mood Signal (Strictly opt-in) */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-[var(--haven-deep)] flex items-center justify-center shrink-0">
                          <Heart className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-display font-bold text-[12px] text-[var(--ink-900)]">
                              Mood Wellness Signal
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[var(--haven-deep)]">
                              Opt-in
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--ink-600)]">
                            Coarse signal (Low / Ok / Good) and gentle partner tips. Raw notes are never shared.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={scopes.moodSignal}
                        disabled={updatingScopeKey === `${partner.id}_moodSignal`}
                        onClick={() => handleToggleScope(partner, 'moodSignal')}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          scopes.moodSignal ? 'bg-[var(--haven-deep)]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            scopes.moodSignal ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 4. Shared Reminders */}
                    <div className="flex items-center justify-between py-2.5 last:pb-1">
                      <div className="flex items-center gap-2.5 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-[12px] text-[var(--ink-900)]">
                            Shared Appointments
                          </p>
                          <p className="text-[10px] text-[var(--ink-600)]">
                            Reminders you specifically mark "Share with partner"
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={scopes.sharedReminders}
                        disabled={updatingScopeKey === `${partner.id}_sharedReminders`}
                        onClick={() => handleToggleScope(partner, 'sharedReminders')}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          scopes.sharedReminders ? 'bg-[var(--haven-deep)]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            scopes.sharedReminders ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Revoke Partner Action */}
                  <div className="pt-1">
                    {confirmRevokeId === partner.id ? (
                      <div className="p-3 bg-rose-50 rounded-[14px] border border-rose-200 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-rose-900 font-medium">
                            Revoke partner connection? They will immediately lose access to all shared logistics, appointments, and wellness signals.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeId(null)}
                            className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isRevoking}
                            onClick={() => handleRevokePartner(partner.id)}
                            className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1 shadow-2xs"
                          >
                            {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            <span>Confirm Revoke</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRevokeId(partner.id)}
                        className="text-[11px] font-display font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke partner access</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* No active partner connected */
          <div className="p-4 bg-[var(--lavender-50)] rounded-[18px] border border-[var(--border-hairline)] space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-[var(--haven-deep)] flex items-center justify-center shrink-0 mt-0.5">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)]">
                  Invite your partner or support person
                </h4>
                <p className="text-[11px] text-[var(--ink-600)] leading-relaxed">
                  They can view hospital logistics, emergency plans, and shared appointments on their own device without seeing your confidential clinical notes.
                </p>
              </div>
            </div>

            {partnerInviteCode ? (
              <div className="p-2.5 bg-white rounded-[14px] border border-[var(--border-hairline)] flex items-center justify-between">
                <span className="font-mono font-bold text-sm tracking-wider text-[var(--haven-deep)] px-2">
                  {partnerInviteCode}
                </span>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="px-3 py-1 text-xs font-display font-bold rounded-lg bg-[var(--lavender-50)] text-[var(--haven-deep)] hover:bg-[var(--lavender-100)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenPartnerShare}
                className="w-full py-2.5 px-3 bg-white border border-[var(--border-hairline)] hover:border-[var(--haven-orchid)] rounded-[14px] text-xs font-display font-bold text-[var(--haven-deep)] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Generate Partner Connection Code</span>
              </button>
            )}
          </div>
        )}

        {/* Previously Revoked or Pending List */}
        {otherPartners.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-hairline)]">
            <p className="text-[11px] font-display font-bold text-[var(--ink-500)] uppercase tracking-wider mb-2">
              Past / Inactive Connections
            </p>
            <div className="space-y-1.5">
              {otherPartners.map((op) => (
                <div key={op.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-[11px] text-[var(--ink-600)]">
                  <span>{op.partnerName || op.connectionCode || 'Partner'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold text-[10px] capitalize">
                    {op.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Check-In Reminders Section (Audit P6.1, §13.6) */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                My Check-in Reminders
              </h4>
              <p className="text-[11px] text-[var(--ink-600)]">
                Daily reminder prompt for mood &amp; well-being log
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={remindersEnabled}
            onClick={() => handleSaveReminders(!remindersEnabled, reminderTime)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              remindersEnabled ? 'bg-[var(--haven-deep)]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                remindersEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Time of day picker */}
        {remindersEnabled && (
          <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--ink-800)]">
              <Clock className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span className="font-display font-bold">Reminder Time:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => handleSaveReminders(remindersEnabled, e.target.value)}
                className="bg-white border border-[var(--border-hairline)] rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--ink-900)] focus:border-[var(--haven-deep)] focus:outline-none cursor-pointer"
              />
              {reminderSavedNotice && (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}

        {/* Push Notifications & Delivery Section (Prompt 2.1) */}
        <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-display font-bold text-[var(--ink-800)]">
                Device Notifications:
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                pushPermission === 'granted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : pushPermission === 'denied'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {pushPermission === 'granted' ? 'Enabled' : pushPermission === 'denied' ? 'Blocked' : 'Not Requested'}
              </span>
            </div>

            {pushPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleEnablePushNotifications}
                disabled={pushLoading}
                className="px-3 py-1 bg-[var(--haven-deep)] hover:bg-[var(--haven-deep)]/90 text-white rounded-lg text-xs font-display font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                {pushLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Enable Push Notifications</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-[var(--ink-600)]">
            Receive automated alerts for Kenya MOH scheduled ANC visits, KEPI vaccines, and danger sign reviews directly on your device.
          </p>

          {/* Action buttons: Test notification & check due */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={testingNotification}
              className="px-2.5 py-1 bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] text-[var(--haven-deep)] rounded-lg text-[11px] font-display font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              {testingNotification ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
              <span>Send Test Notification</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerProcessDue}
              disabled={checkingDueReminders}
              className="px-2.5 py-1 bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] text-[var(--ink-800)] border border-[var(--border-hairline)] rounded-lg text-[11px] font-display font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              {checkingDueReminders ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
              <span>Check Due Reminders Now</span>
            </button>
          </div>

          {pushStatusMessage && (
            <div className="p-2 rounded-lg bg-[var(--lavender-50)] border border-[var(--border-hairline)] text-[11px] text-[var(--haven-deep)] font-medium">
              {pushStatusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Security & Access Section */}
      <div className="bg-white rounded-[24px] p-4 border border-[var(--border-hairline)] shadow-card-1 space-y-1">
        <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] px-2 py-1">
          Security &amp; Health Records
        </h3>

        {/* App Lock PIN */}
        <div
          onClick={onOpenPinSetup}
          className="flex items-center justify-between p-3 rounded-[16px] hover:bg-[var(--lavender-50)] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[var(--haven-deep)] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                App Lock PIN
              </h4>
              <p className="text-[12px] text-[var(--ink-600)]">4-digit confidential lock</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />
        </div>

        {/* Export Data */}
        <div
          onClick={onOpenExportData}
          className="flex items-center justify-between p-3 rounded-[16px] hover:bg-[var(--lavender-50)] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Download Health Passport Data
              </h4>
              <p className="text-[12px] text-[var(--ink-600)]">MOH 216 JSON / PDF backup</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 rounded-full border border-rose-200 text-rose-700 bg-rose-50/50 font-display font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of MomHaven</span>
      </button>
    </div>
  );
}
