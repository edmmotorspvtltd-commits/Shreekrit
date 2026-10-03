import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, AlertCircle, ShieldCheck, Heart, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signup') {
      setSuccessMessage('Almost done! Check your email for a link to confirm your account.');
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#1A120B]/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] paper-bg overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        <div className="h-1.5 bg-gradient-to-r from-[#8C2711] via-[#E5A93C] to-[#2A4B7C] flex-shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-3 p-2 rounded-full hover:bg-[#EAE0CD] text-[#241A14] transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-4 text-center bg-[#F4EADB] border-b border-[#E0D0B8] flex-shrink-0">
          <img
            src="/shreekrit-logo.png"
            alt="Shreekrit"
            className="h-16 w-auto mx-auto object-contain"
            draggable={false}
          />
          <p className="mt-1 font-serif text-[11px] text-[#8C2711] tracking-widest uppercase font-semibold">
            Authentic Folk Art Archive
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-center mb-5">
            <h3 className="font-serif-display font-bold text-2xl text-[#241A14]">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h3>
            <p className="mt-1 text-xs text-[#665141]">
              {mode === 'login'
                ? 'Log in to track your orders and manage your collection.'
                : 'Join Shreekrit to track orders and collect original Mithila art.'}
            </p>
          </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-[#5A4535] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C2711] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-base rounded border border-[#D5C3A5] bg-white/70 focus:outline-[#8C2711]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-[#5A4535] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C2711] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={mode === 'signup' ? 10 : undefined}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 text-base rounded border border-[#D5C3A5] bg-white/70 focus:outline-[#8C2711]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 rounded text-[#7A6452] hover:text-[#8C2711] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-[#7A6452] leading-snug">
                    <KeyRound className="w-3.5 h-3.5 text-[#E5A93C] flex-shrink-0 mt-px" />
                    <span>Tip: when your browser asks, choose <strong>Save password</strong> so you can log in and track your orders easily.</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-[#FBEAE6] rounded border border-[#E0A192] text-xs text-[#8C2711] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-[#E5EEE2] rounded border border-[#A4C4A5] text-xs text-[#426B43] font-medium flex items-center gap-2 text-center">
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setSuccessMessage(null);
                  setShowPassword(false);
                }}
                className="w-full text-center text-xs text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </form>
        </div>

        <div className="px-6 py-3 bg-[#F4EADB] border-t border-[#E0D0B8] flex items-center justify-center gap-4 text-[11px] text-[#7A6452] flex-shrink-0">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#426B43]" /> Certified Originals</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#C94A29]" /> Direct from Artisans</span>
        </div>
      </motion.div>
    </div>
  );
};
