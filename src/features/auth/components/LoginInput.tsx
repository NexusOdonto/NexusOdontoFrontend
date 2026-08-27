import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginInputProps {
  type: 'email' | 'password';
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
  const icon = type === 'email' ? <Mail className="w-5 h-5 text-slate-300" /> : <Lock className="w-5 h-5 text-slate-300" />;

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        type={type === 'password' && showPassword ? 'text' : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-300 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-all duration-200 ${type === 'password' && onTogglePassword ? 'pr-12' : 'pr-4'}`}
      />
      {/* Password visibility toggle */}
      {type === 'password' && onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-300 transition-colors focus:outline-none bg-transparent border-none"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};
