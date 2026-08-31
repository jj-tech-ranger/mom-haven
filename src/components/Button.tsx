import React from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'emergency';
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export default function Button({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  id,
  style: userStyle,
}: ButtonProps) {
  const base = 'font-display font-semibold text-[15px] rounded-pill px-6 py-3.5 w-full cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'text-white hover:opacity-95',
    secondary: 'bg-white text-haven-deep border-[1.5px] border-haven-deep hover:bg-lavender-50',
    tertiary: 'bg-transparent text-haven-deep font-semibold underline-offset-2 hover:underline',
    destructive: 'bg-white text-status-urgent border-[1.5px] border-status-urgent hover:bg-status-urgent-bg',
    emergency: 'text-white hover:opacity-95',
  };
  const defaultStyle =
    variant === 'primary'
      ? { background: 'var(--grad-haven)', boxShadow: '0 6px 16px rgba(51,23,138,0.28)' }
      : variant === 'emergency'
      ? { background: '#E11D3C', boxShadow: '0 8px 20px rgba(225,29,60,0.35)' }
      : undefined;

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ ...defaultStyle, ...userStyle }}
    >
      {children}
    </button>
  );
}
