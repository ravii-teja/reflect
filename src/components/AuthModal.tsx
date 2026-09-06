import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { X, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your name.');
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed or was closed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          {/* Reflect Logo */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#FF6321] flex items-center justify-center shadow-2xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FAF9F6]" />
            </div>
            <span
              className="text-2xl font-medium tracking-tight text-[#1A1A1A]"
              style={{ fontFamily: '"Georgia", Cambria, serif' }}
            >
              Reflect
            </span>
          </div>
          <p className="text-xs text-[#8C8781] leading-relaxed">
            {isRegister
              ? 'Create an account to save your reflections and memories.'
              : 'Sign in to access your saved reflections and insights.'}
          </p>

          {/* Clean Sign In / Sign Up Segmented Control */}
          <div className="mt-4 flex items-center justify-center p-1 bg-[#F0EEEA] rounded-full border border-[#E8E4DF] w-fit mx-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`px-4 py-1 rounded-full transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-white text-[#1A1A1A] shadow-2xs font-semibold'
                  : 'text-[#6B665F] hover:text-[#1A1A1A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`px-4 py-1 rounded-full transition-all cursor-pointer ${
                isRegister
                  ? 'bg-white text-[#1A1A1A] shadow-2xs font-semibold'
                  : 'text-[#6B665F] hover:text-[#1A1A1A]'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-tight">
            {error}
          </div>
        )}

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 mb-3 rounded-2xl bg-white hover:bg-[#F5F3F0] border border-[#E8E4DF] text-[#1A1A1A] font-medium text-xs flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-semibold text-sm text-[#1A1A1A]">Continue with Google</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E4DF]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#8C8781] tracking-wider">
            <span className="bg-[#FAF9F6] px-2">or with email address</span>
          </div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-[#6B665F] mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DF] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6321]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#6B665F] mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DF] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6321]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6B665F] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DF] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6321]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-2xl bg-[#FF6321] hover:bg-[#E8591E] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#FF632133] mt-2 cursor-pointer"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-[#8C8781] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
