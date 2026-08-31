import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
interface RevokeAccessModalProps { isOpen:boolean; targetName:string; onClose:()=>void; onConfirm:()=>void; }
export const RevokeAccessModal:React.FC<RevokeAccessModalProps>=({isOpen,targetName,onClose,onConfirm})=>{
 if(!isOpen)return null;
 return <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
  <div className="bg-white rounded-[24px] w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-up border border-border-hairline text-center">
   <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto"><AlertTriangle className="w-7 h-7"/></div>
   <div className="space-y-1.5"><h3 className="font-display font-bold text-xl text-ink-900">Revoke access?</h3><p className="font-body text-xs text-ink-600 leading-relaxed max-w-[280px] mx-auto">Remove access for <span className="font-bold text-ink-900">{targetName}</span>? They will no longer be able to access the information covered by this connection.</p></div>
   <div className="space-y-2.5 pt-2"><button onClick={onConfirm} className="w-full py-3.5 bg-red-600 text-white font-display font-bold text-sm rounded-pill shadow-button flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/>Confirm revoke</button><button onClick={onClose} className="w-full py-3 bg-white border border-border-hairline text-ink-700 font-display font-bold text-sm rounded-pill hover:bg-lavender-50">Keep access</button></div>
  </div>
 </div>;
};
