import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
}) => {
  const baseClasses = 'w-full font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = variant === 'primary' 
    ? 'bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-xl py-3.5'
    : variant === 'secondary'
    ? 'bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl py-3'
    : 'bg-transparent hover:bg-slate-800 text-slate-300 text-sm rounded-xl py-3';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};
