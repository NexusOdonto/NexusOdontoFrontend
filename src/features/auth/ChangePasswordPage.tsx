import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2, Circle, KeyRound, ArrowRight, UserCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from './AuthContext';
import fondoLoginLight from '../../assets/fondo-Login-ligh.webp';
import fondoLoginDark from '../../assets/fondoLogin.webp';
import logoNexus from '../../assets/nexus-odonto-logo.webp';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, changePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasLength && hasUpper && hasNumber && isMatch;

  let strengthScore = 0;
  if (hasLength) strengthScore++;
  if (hasUpper) strengthScore++;
  if (hasNumber) strengthScore++;
  if (/[^A-Za-z0-9]/.test(newPassword)) strengthScore++;

  const getStrengthLabel = () => {
    if (!newPassword) return { label: 'Muy Débil', color: 'text-rose-500', barBg: 'bg-rose-500', width: 'w-0' };
    if (strengthScore <= 1) return { label: 'Débil', color: 'text-rose-500', barBg: 'bg-rose-500', width: 'w-1/4' };
    if (strengthScore <= 3) return { label: 'Aceptable', color: 'text-amber-500', barBg: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Fuerte', color: 'text-emerald-500', barBg: 'bg-emerald-500', width: 'w-full' };
  };

  const strengthInfo = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError('');
    setIsSubmitting(true);

    try {
      if (changePassword) {
        const res = await changePassword(newPassword);
        if (res.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(res.error || 'Error al actualizar la contraseña.');
        }
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundImage = theme === 'dark' ? fondoLoginDark : fondoLoginLight;

  return (
    <main
      role="main"
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="relative w-full max-w-md mx-auto group transition-all duration-500 hover:-translate-y-1.5">
        <div className="absolute -inset-4 rotate-[-4deg] rounded-3xl bg-teal-500/10 backdrop-blur-sm border border-teal-400/20 shadow-xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-7 group-hover:rotate-[-10deg] group-hover:scale-105 group-hover:bg-teal-500/20" />
        <div className="absolute -inset-2 rotate-3deg rounded-3xl bg-slate-200/40 dark:bg-slate-900/30 backdrop-blur-md border border-cyan-400/20 shadow-2xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-5 group-hover:rotate-[8deg] group-hover:scale-105 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-900/60" />

        <div className="relative z-10 w-full p-8 md:p-10 rounded-3xl backdrop-blur-xl border transition-all duration-500 ease-out flex flex-col gap-5 group-hover:scale-[1.02] group-hover:-translate-y-1 bg-white/85 border-slate-200/80 text-slate-800 shadow-2xl dark:bg-slate-900/80 dark:border-slate-800/80 dark:text-white">
          
          <div className="flex justify-center select-none -mb-1">
            <img src={logoNexus} alt="NexusOdonto" className="h-10 w-auto object-contain drop-shadow-md" />
          </div>

          <div className="inline-flex items-center gap-2 self-center px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <ShieldAlert size={14} />
            <span>Primer Inicio de Sesión — Seguridad</span>
          </div>

          <div className="text-center">
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-600 dark:from-white dark:via-slate-100 dark:to-teal-300 bg-clip-text text-transparent font-extrabold text-2xl tracking-tight">
              Actualiza tu Contraseña
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Por motivos de seguridad y para proteger tus registros clínicos, debes crear una nueva contraseña personal antes de ver tus citas.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Paciente Registrado</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user?.name || user?.cedula ? `${user?.name || 'Paciente'} (Cédula: ${user?.cedula || ''})` : 'Paciente Nexus Odonto'}
              </span>
            </div>
            <UserCheck className="text-teal-500 h-5 w-5" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400 h-4 w-4" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${strengthInfo.barBg} ${strengthInfo.width}`} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Seguridad de contraseña:</span>
                <span className={`font-semibold ${strengthInfo.color}`}>{strengthInfo.label}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400 h-4 w-4" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${hasLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                {hasLength ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-500' : 'text-slate-400'}`}>
                {hasUpper ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                <span>Al menos una letra mayúscula</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-500' : 'text-slate-400'}`}>
                {hasNumber ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                <span>Al menos un número</span>
              </div>
              <div className={`flex items-center gap-2 ${isMatch ? 'text-emerald-500' : 'text-slate-400'}`}>
                {isMatch ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                <span>Las contraseñas coinciden</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>Guardar y Ver Mis Citas</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
