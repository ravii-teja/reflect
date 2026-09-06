import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { X, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAsDevUser } = useAuth();
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

  const handleDevSignIn = async () => {
    setError('');
    await loginAsDevUser('Ravi');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F0EEEA] border border-[#E8E4DF] text-[#FF6321] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2
            className="text-2xl font-light text-[#1A1A1A] tracking-tight"
            style={{ fontFamily: '"Georgia", Cambria, serif' }}
          >
            {isRegister ? 'Create your private vault' : 'Sign in to Reflect'}
          </h2>
          <p className="text-xs text-[#8C8781] mt-1.5 leading-relaxed">
            Your reflections and semantic memories are isolated strictly to your authenticated identity.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-tight">
            {error}
          </div>
        )}

        {/* Quick Demo Continue Button (Ideal for iframe preview) */}
        <button
          onClick={handleDevSignIn}
          className="w-full py-2.5 px-4 mb-3 rounded-2xl bg-[#F0EEEA] hover:bg-[#E8E4DF] border border-[#E8E4DF] text-[#1A1A1A] font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF6321]" />
          <span>Continue as Ravi (bankupalli.raviteja@gmail.com)</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E4DF]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#8C8781] tracking-wider">
            <span className="bg-[#FAF9F6] px-2">or sign in with credentials</span>
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
                placeholder="e.g. Ravi"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DF] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6321]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#6B665F] mb-1">Email</label>
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
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
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

        <div className="mt-6 pt-4 border-t border-[#E8E4DF] flex items-center justify-center gap-1.5 text-[11px] text-[#8C8781]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF6321]" />
          <span>Zero-Knowledge E2EE + User Scoped Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
};
