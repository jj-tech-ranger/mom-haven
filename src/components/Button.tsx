import React from 'react';

export interface ButtonProps { variant?: 'primary'|'secondary'|'tertiary'|'destructive'|'emergency'; children: React.ReactNode; onClick?: (event: React.MouseEvent<HTMLButtonElement>)=>void; type?: 'button'|'submit'|'reset'; disabled?: boolean; className?: string; id?: string; style?: React.CSSProperties; }

export default function Button({variant='primary',children,onClick,type='button',disabled=false,className='',id,style:userStyle}:ButtonProps){
  const base='min-h-12 w-full cursor-pointer rounded-md px-6 py-3.5 font-consumer text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const variants={
    primary:'bg-brand-primary text-white hover:bg-brand-primary-hover',
    secondary:'border border-brand-primary bg-white text-brand-primary hover:bg-brand-surface',
    tertiary:'bg-transparent text-brand-primary underline-offset-2 hover:underline',
    destructive:'border border-clinical-danger bg-white text-clinical-danger hover:bg-clinical-danger-bg',
    emergency:'bg-clinical-danger text-white hover:bg-[#A93226]',
  };
  return <button id={id} type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`} style={userStyle}>{children}</button>;
}
