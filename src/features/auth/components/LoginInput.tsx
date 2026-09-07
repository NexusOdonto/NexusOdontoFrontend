import React from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginInputProps {
  type: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const LoginInput: React.FC<LoginInputProps> = ({
  type,
  placeholder,
  value,
  onChange,
  name,
  showPassword,
  onTogglePassword,
}) => {
  const icon = type === 'email' || type === 'text' ? <User className="w-5 h-5 text-slate-400 dark:text-slate-400" /> : <Lock className="w-5 h-5 text-slate-400 dark:text-slate-400" />;

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        type={type === 'password' && showPassword ? 'text' : type === 'email' ? 'text' : type}
        name={name}
        id={name}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-12 py-3 rounded-xl text-sm transition-all duration-200 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:bg-slate-800/70 dark:border-slate-700/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:focus:border-teal-400 dark:focus:ring-teal-400 focus:outline-none ${type === 'password' && onTogglePassword ? 'pr-12' : 'pr-4'}`}
      />
      {/* Password visibility toggle with accessible touch target */}
      {type === 'password' && onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 transition-colors focus:outline-none bg-transparent border-none min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};
