import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenVault?: () => void;
  onOpenSecurity?: () => void;
  onOpenAuth: () => void;
  onNewSession: () => void;
  memoriesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVault,
  onOpenAuth,
  onNewSession
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b border-[#E8E4DF] bg-[#FAF9F6]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        
        {/* Brand: Reflect logo with Reflect word */}
        <div className="flex items-center">
          <button
            onClick={onNewSession}
            className="group flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            title="Start new reflection"
          >
            {/* Reflect Logo */}
            <div className="w-6 h-6 rounded-full bg-[#FF6321] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[#FAF9F6]" />
            </div>
            <span
              className="text-lg sm:text-xl font-medium tracking-tight text-[#1A1A1A]"
              style={{ fontFamily: '"Georgia", Cambria, serif' }}
            >
              Reflect
            </span>
          </button>
        </div>

        {/* Minimalist Right Action: Authenticated Profile or Sign in / Sign up */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            /* Authenticated: Minimal Profile Avatar & Sign Out */
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={onOpenVault}
                className="flex items-center gap-2 bg-[#F0EEEA] hover:bg-[#E8E4DF] pl-1.5 pr-3 py-1 rounded-full text-xs font-medium text-[#1A1A1A] transition-colors cursor-pointer group shadow-2xs"
                title="Personal Vault & Context"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Profile'}
                    className="w-6 h-6 rounded-full object-cover border border-[#E8E4DF]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#FF6321] text-white flex items-center justify-center text-[11px] font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[110px] sm:max-w-[150px] font-medium text-[#1A1A1A]">
                  {user.displayName || user.email.split('@')[0]}
                </span>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Unauthenticated: Minimalist Sign in / Sign up button */
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#F0EEEA] border border-[#E8E4DF] rounded-full transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
              title="Sign in or create an account"
            >
              Sign in / Sign up
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
