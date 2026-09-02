import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'emergency' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

// src/components/Button.jsx / Button.tsx
export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'font-display font-semibold text-[15px] rounded-[28px] px-6 py-3.5 w-full inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants: Record<ButtonVariant, string> = {
    primary: 'text-white active:scale-[0.99]',
    secondary: 'bg-white text-[var(--haven-deep)] border-[1.5px] border-[var(--haven-deep)] hover:bg-[var(--lavender-50)]',
    outline: 'bg-white text-[var(--ink-900)] border border-[var(--border-hairline)] hover:bg-[var(--lavender-50)]',
    tertiary: 'bg-transparent text-[var(--haven-deep)] font-semibold underline-offset-2 hover:underline',
    destructive: 'bg-white text-[var(--status-urgent)] border-[1.5px] border-[var(--status-urgent)] hover:bg-[var(--status-urgent-bg)]',
    emergency: 'text-white active:scale-[0.99]',
  };

  const style =
    variant === 'primary'
      ? { background: 'var(--grad-haven)', boxShadow: '0 6px 16px rgba(51,23,138,0.28)' }
      : variant === 'emergency'
      ? { background: '#E11D3C', boxShadow: '0 8px 20px rgba(225,29,60,0.35)' }
      : undefined;

  return (
    <button className={`${base} ${variants[variant]} ${className}`} style={style} {...props}>
      {children}
    </button>
  );
}
