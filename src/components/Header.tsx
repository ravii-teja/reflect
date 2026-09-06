import React from 'react';
import { ShieldCheck, Lock, Sparkles, Brain, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenMemories: () => void;
  onOpenSecurity: () => void;
  onOpenAuth: () => void;
  onNewSession: () => void;
  memoriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMemories,
  onOpenSecurity,
  onOpenAuth,
  onNewSession,
  memoriesCount
}) => {
  const { user, logout, authMode } = useAuth();

  return (
    <header className="w-full border-b border-[#E8E4DF] bg-[#FAF9F6]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewSession}
            className="group flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            title="Start new reflection"
          >
            <div className="w-6 h-6 rounded-full bg-[#FF6321] transition-transform duration-200 group-hover:scale-105" />
            <span className="text-xl font-semibold tracking-tight text-[#1A1A1A]">Reflect</span>
          </button>
          
          <span className="hidden md:inline-block text-xs font-medium text-[#8C8781] ml-2">
            End-to-End Encrypted
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Memories Vault */}
          <button
            onClick={onOpenMemories}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] bg-white hover:bg-[#F0EEEA] border border-[#E8E4DF] rounded-full transition-all cursor-pointer shadow-2xs"
            title="Semantic Personal Memory Vault"
          >
            <Brain className="w-3.5 h-3.5 text-[#FF6321]" />
            <span className="hidden sm:inline">Memories</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#F5F3F0] text-[10px] font-semibold text-[#6B665F]">
              {memoriesCount}
            </span>
          </button>

          {/* Security & Observability */}
          <button
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#6B665F] hover:text-[#1A1A1A] bg-white hover:bg-[#F0EEEA] border border-[#E8E4DF] rounded-full transition-all cursor-pointer shadow-2xs"
            title="Security Audit & Observability"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Security</span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E8E4DF]">
              <div className="flex items-center gap-2 bg-[#F0EEEA] px-3 py-1.5 rounded-full text-xs font-medium text-[#1A1A1A]">
                <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-pulse" />
                <span className="truncate max-w-[100px] sm:max-w-[130px]">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                {authMode === 'demo' && (
                  <span className="text-[10px] text-[#8C8781] uppercase font-bold tracking-wider">demo</span>
                )}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#1A1A1A] hover:bg-[#2D2A26] rounded-full transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
