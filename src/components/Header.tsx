import { Shield, LogIn, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

interface HeaderProps {
  user: User | null;
  profile: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Header({ user, profile, onSignIn, onSignOut }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-md z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
          <Shield className="w-6 h-6 text-emerald-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">Guardian Bridge</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Crisis Response Orchestrator</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-white">{user.displayName}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{profile?.role}</p>
            </div>
            <button 
              onClick={onSignOut}
              aria-label="Sign Out"
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onSignIn}
            aria-label="Sign In with Google"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-900/20"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
