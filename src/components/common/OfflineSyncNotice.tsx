// src/components/common/OfflineSyncNotice.tsx
import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSyncStatus } from '../../services/syncEngine';

interface OfflineSyncBannerProps {
  className?: string;
  compact?: boolean;
}

/**
 * Top-level status banner for displaying connectivity & sync status
 */
export function OfflineSyncBanner({ className = '', compact = false }: OfflineSyncBannerProps) {
  const { isOnline, pendingCount, isSyncing, syncNow } = useSyncStatus();

  // If online and nothing is syncing or pending, hide the banner
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium ${
        !isOnline ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-blue-50 border border-blue-200 text-blue-900'
      } ${className}`}>
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Offline · {pendingCount} queued</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
            <span>Syncing {pendingCount} records...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{pendingCount} waiting to sync</span>
            <button
              type="button"
              onClick={() => syncNow()}
              className="ml-auto underline hover:text-blue-800 text-[11px]"
            >
              Sync Now
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`px-4 py-2.5 transition-all text-xs font-medium border-b ${
      !isOnline
        ? 'bg-amber-500/10 border-amber-300 text-amber-950'
        : isSyncing
        ? 'bg-blue-500/10 border-blue-300 text-blue-950'
        : 'bg-emerald-500/10 border-emerald-300 text-emerald-950'
    } ${className}`}>
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          ) : isSyncing ? (
            <RefreshCw className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          )}

          <div className="truncate">
            <span className="font-semibold">
              {!isOnline
                ? 'Offline Mode'
                : isSyncing
                ? 'Syncing records'
                : 'Pending sync'}
            </span>
            <span className="text-[11px] opacity-90 block sm:inline sm:ml-1.5">
              {!isOnline
                ? 'Data entered is saved locally and will upload once connected.'
                : isSyncing
                ? `Uploading ${pendingCount} offline record${pendingCount === 1 ? '' : 's'}...`
                : `${pendingCount} record${pendingCount === 1 ? '' : 's'} ready to upload.`}
            </span>
          </div>
        </div>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            type="button"
            onClick={() => syncNow()}
            className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-white border border-slate-300 text-slate-800 shadow-xs hover:bg-slate-50 shrink-0 cursor-pointer"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
}

interface FormSaveNoticeProps {
  isOfflineQueued: boolean;
  onDismiss?: () => void;
}

/**
 * In-form confirmation alert displayed immediately after saving an offline record
 */
export function FormSaveNotice({ isOfflineQueued }: FormSaveNoticeProps) {
  if (!isOfflineQueued) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Record saved successfully to your health file.</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
      <WifiOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-amber-900">Saved locally to this device</p>
        <p className="text-amber-800 text-[11px] mt-0.5">
          You are currently offline. Your record has been safely stored and will sync automatically when an internet connection is detected.
        </p>
      </div>
    </div>
  );
}
