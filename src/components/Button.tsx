import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'brandPrimary'|'brandSecondary'|'clinicalAction'|'dangerEmergency'|'ghost'|'primary'|'secondary'|'tertiary'|'destructive'|'emergency';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({variant='brandPrimary',children,isLoading=false,fullWidth=false,className='',disabled,...props}:ButtonProps){
  const base='inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl font-medium text-base transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#5B2C6F] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants={brandPrimary:'bg-[#5B2C6F] text-white hover:bg-[#4A235A] active:bg-[#3B1C48]',brandSecondary:'bg-[#F5EEF8] text-[#5B2C6F] hover:bg-[#EBDDF2] border border-[#D5C2E0]',clinicalAction:'bg-slate-900 text-white hover:bg-slate-800',dangerEmergency:'bg-[#C0392B] text-white hover:bg-[#A93226] font-bold shadow-md',ghost:'bg-transparent text-[#566573] hover:bg-slate-100 hover:text-[#1C2833]',primary:'bg-[#5B2C6F] text-white hover:bg-[#4A235A] active:bg-[#3B1C48]',secondary:'bg-[#F5EEF8] text-[#5B2C6F] hover:bg-[#EBDDF2] border border-[#D5C2E0]',tertiary:'bg-transparent text-[#5B2C6F] underline-offset-2 hover:underline',destructive:'border border-[#C0392B] bg-white text-[#C0392B] hover:bg-[#FEF2F2]',emergency:'bg-[#C0392B] text-white hover:bg-[#A93226] font-bold shadow-md'};
  return <button className={`${base} ${variants[variant]} ${fullWidth?'w-full':''} ${className}`} disabled={disabled||isLoading} {...props}>{isLoading?<span className="flex items-center gap-2"><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span>Processing…</span></span>:children}</button>;
}
