import React from 'react';
import { Home, Smartphone, Truck, User } from 'lucide-react';
import type { ApiUser } from '../../utils/api';

interface MobileBottomNavBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenTrackOrder: () => void;
  currentUser?: ApiUser | null;
  isWorkflow?: boolean;
  activeStage?: string;
  wizardStep?: number;
  reviewStepIndex?: number;
}

export const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  currentPath,
  onNavigate,
  onOpenTrackOrder,
  currentUser,
  isWorkflow = false,
  activeStage = 'select',
  wizardStep = 0,
  reviewStepIndex = 6,
}) => {
  // If the user is currently inside the evaluation wizard steps (before final review),
  // MobileBottomHUD takes over the bottom bar for step actions and live price HUD.
  const isInsideWizard = isWorkflow && activeStage === 'diagnose' && wizardStep < reviewStepIndex;
  if (isInsideWizard) return null;

  // Normalize path without query params
  const cleanPath = currentPath.split('?')[0];

  const isHomeActive = cleanPath === '/' && !isWorkflow;
  const isSellActive = cleanPath === '/smartphones' || isWorkflow;
  const isAccountActive = cleanPath.startsWith('/profile') || cleanPath.startsWith('/login') || cleanPath.startsWith('/signup');

  const userInitial = currentUser?.name
    ? currentUser.name.trim().charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 sm:hidden"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none ${
            isHomeActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${isHomeActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Home</span>
        </button>

        {/* 2. Sell Phone / Instant Quote */}
        <button
          type="button"
          onClick={() => onNavigate('/smartphones')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none ${
            isSellActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Smartphone className={`w-5 h-5 transition-transform ${isSellActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">Sell Phone</span>
        </button>

        {/* 3. Track Order */}
        <button
          type="button"
          onClick={onOpenTrackOrder}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none text-slate-500 hover:text-slate-800 font-medium"
        >
          <Truck className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Track</span>
        </button>

        {/* 4. Account / Profile */}
        <button
          type="button"
          onClick={() => onNavigate(currentUser ? '/profile' : '/login')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none ${
            isAccountActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          {currentUser ? (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ${
              isAccountActive ? 'bg-blue-600 ring-2 ring-blue-600/30' : 'bg-slate-700'
            }`}>
              {userInitial}
            </div>
          ) : (
            <User className={`w-5 h-5 transition-transform ${isAccountActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          )}
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            {currentUser ? 'Account' : 'Login'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNavBar;

