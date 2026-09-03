import { useState, useEffect, useRef, useMemo, Suspense, useCallback, startTransition } from 'react';
// Types only — no heavy data arrays in this import (keeps initial bundle lean)
import type { Model, Variant, DefectRule, Brand, Booking } from './data/mockDatabase';
// Helper functions needed at startup — imported statically but lightweight
import { generateVariantsForModel, getDeviceImage, getDefectRulesForCategory, getMaxVariantPrice, isTabletDevice } from './data/mockDatabase';
import { fetchBrands, fetchModels, getCachedModels, fetchBookings as apiFetchBookings, fetchCurrentUser, customerLogout, hasAdminToken, syncFirebaseUser, ApiUser } from './utils/api';
import { subscribeToFirebaseAuth, checkRedirectAuthResult } from './services/firebaseAuth';
import { applyBrandOrder } from './utils/ordering';
import { DeviceSelector, BrandLogo } from './components/client/DeviceSelector';
import { DeviceCategoryShowcase } from './components/client/DeviceCategoryShowcase';
import { SellYourDevice } from './components/client/SellYourDevice';
import { HeaderNav } from './components/client/HeaderNav';
import { TabletsShowcase } from './components/client/TabletsShowcase';
import { AboutPage } from './components/client/AboutPage';
import { ContactPage } from './components/client/ContactPage';
import LoginPage from './components/client/LoginPage';
import SignupPage from './components/client/SignupPage';
import ProfilePage from './components/client/ProfilePage';
import ForgotPasswordPage from './components/client/ForgotPasswordPage';
import ResetPasswordPage from './components/client/ResetPasswordPage';
import VerifyEmailPage from './components/client/VerifyEmailPage';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ComingSoon } from './components/client/ComingSoon';
import { PilotModeBanner } from './components/client/PilotModeBanner';
import { PilotFeedbackSection } from './components/client/PilotFeedbackSection';
import { FeedbackModal } from './components/client/FeedbackModal';
import { PILOT_MODE_ENABLED } from './config/pilotMode';
import { useFocusTrap } from './hooks/useFocusTrap';
import { safeLazy } from './utils/safeLazy';

// ── Lazy-loaded heavy components (code splitting with chunk auto-retry) ──────
const DiagnosticWizard   = safeLazy(() => import('./components/client/DiagnosticWizard'), 'DiagnosticWizard');
const PickupScheduler    = safeLazy(() => import('./components/client/PickupScheduler'), 'PickupScheduler');
import { SECRET_ADMIN_PATH, DECOY_ADMIN_PATHS } from './constants/routes';

const AdminPanel         = safeLazy(() => import('./components/admin/AdminPanel'), 'AdminPanel');
const AdminPinGate       = safeLazy(() => import('./components/admin/AdminPinGate'), 'AdminPinGate');
const SmartphoneMockup   = safeLazy(() => import('./components/client/SmartphoneMockup'), 'SmartphoneMockup');
const OrderTrackingModal = safeLazy(() => import('./components/client/OrderTrackingModal'), 'OrderTrackingModal');
// ─────────────────────────────────────────────────────────────────────────────
import { 
  Award, ShieldCheck, Zap, Search,
  X,
  Truck, Lock, CheckCircle2, Sparkles, ArrowRight, Info, Code, GitBranch, Database, Instagram
} from 'lucide-react';

import applePhoneImg from './assets/apple_phone.png';
import samsungPhoneImg from './assets/samsung_phone.png';
import oneplusPhoneImg from './assets/oneplus_phone.png';

// ── Secure localStorage helpers ──────────────────────────────────────────────
// Only non-sensitive navigation state is persisted (activeStage, wizardStep).
// PII and financial data (model, variant, price, defects) live in React state only.

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredNavState {
  activeStage: 'select' | 'tablets' | 'diagnose' | 'schedule' | 'admin';
  wizardStep: number;
  selectedModelId?: string;
  selectedVariant?: Variant;
  selectedDefectIds?: string[];
  finalPrice?: number;
  timestamp: number;
}

function loadNavState(): StoredNavState | null {
  try {
    const raw = localStorage.getItem('stc_nav');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredNavState;
    // Validate shape and TTL
    if (
      typeof parsed !== 'object' || parsed === null ||
      !['select', 'tablets', 'diagnose', 'schedule', 'admin'].includes(parsed.activeStage) ||
      typeof parsed.wizardStep !== 'number' ||
      typeof parsed.timestamp !== 'number' ||
      Date.now() - parsed.timestamp > SESSION_TTL_MS
    ) {
      localStorage.removeItem('stc_nav');
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem('stc_nav');
    return null;
  }
}

function saveNavState(state: Omit<StoredNavState, 'timestamp'>) {
  try {
    localStorage.setItem('stc_nav', JSON.stringify({ ...state, timestamp: Date.now() }));
  } catch {
    // Silently fail if storage is full
  }
}

function clearNavState() {
  localStorage.removeItem('stc_nav');
}

// ────────────────────────────────────────────────────────────────────────────

interface SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SpecsModal({ isOpen, onClose }: SpecsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="System Design Specification"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div ref={modalRef} className="bg-canvas-pure border border-ice-border rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-premium overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border bg-canvas-white">
          <div className="text-left">
            <h3 className="font-outfit font-light text-xl text-ink-navy">System Design Specification</h3>
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Rephonix Architecture</span>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close system design specification"
            className="p-2 rounded-sm border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left text-sm text-ink-slate leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <Info className="w-5 h-5 text-cobalt" />
              1. Business Architecture &amp; Pillars
            </div>
            <p className="font-light">Rephonix bridges the gap between high-volume commercial supply and consumer convenience, structured across three key pillars:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-canvas-white p-3 border border-ice-border rounded-sm">
                <span className="text-cobalt font-semibold block text-xs uppercase font-mono mb-1">C2B Sourcing</span>
                <p className="text-xs font-light text-zinc-500">Consumer direct digital self-diagnostic wizard for honest grading, instant dynamic valuations, and doorstep pickups.</p>
              </div>
              <div className="bg-canvas-white p-3 border border-ice-border rounded-sm">
                <span className="text-cobalt font-semibold block text-xs uppercase font-mono mb-1">B2B2C Ingestion</span>
                <p className="text-xs font-light text-zinc-500">A blind marketplace allowing vetted physical retail storefront partners to list refurbished inventory under strict grading rules.</p>
              </div>
              <div className="bg-canvas-white p-3 border border-ice-border rounded-sm">
                <span className="text-cobalt font-semibold block text-xs uppercase font-mono mb-1">B2C Storefront</span>
                <p className="text-xs font-light text-zinc-500">A masked, high-trust store (similar to Apple Certified Refurbished) featuring certified quality, warranties, and fulfillment.</p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <Code className="w-5 h-5 text-cobalt" />
              2. Design System Specification
            </div>
            <p className="font-light">Following the Industrial Luxury visual model, the interface focuses on spatial tactile cards, micro-borders, and high-fidelity overlays.</p>
            <table className="w-full text-xs font-mono text-ink-slate border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-ink-navy text-left">
                  <th className="py-2">Token</th>
                  <th className="py-2">Color Space</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Obsidian Canvas</td>
                  <td className="py-2 text-zinc-400">#09090B</td>
                  <td className="py-2">Main background canvas</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Card Pure</td>
                  <td className="py-2 text-zinc-400">#121214</td>
                  <td className="py-2">Elevated surfaces &amp; interactive panels</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Industrial Cobalt</td>
                  <td className="py-2 text-zinc-400">#3B82F6 / #1D4ED8</td>
                  <td className="py-2">Brand focus, interactive states, locks</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Zinc Alabaster</td>
                  <td className="py-2 text-zinc-400">#F4F4F5</td>
                  <td className="py-2">Primary readable text</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <GitBranch className="w-5 h-5 text-cobalt" />
              3. Dynamic Valuation Algorithm
            </div>
            <p className="font-light">Values are computed programmatically using base-to-defect pricing formula unique to each model variant:</p>
            <div className="bg-canvas-white p-4 rounded-sm border border-ice-border text-xs font-mono text-center text-cobalt">
              Price_Final = Price_Base - Σ ( Deduction_Fixed + ( Price_Base × Deduction_Percentage ) )
            </div>
            <div className="text-xs space-y-1 font-light text-zinc-500">
              <div>• <strong>Price_Base</strong>: Anchor price set for a flawless device variant.</div>
              <div>• <strong>Deduction_Fixed</strong>: Cash deduction applied for accessories (e.g. missing box).</div>
              <div>• <strong>Deduction_Percentage</strong>: Proportional penalty for wear/damage (e.g. 28% for flagship screen crack).</div>
              <div>• <strong>Category Caps</strong>: Screen (Max 40%), Body (Max 20%), Camera (Max 18%), Battery (Max 8%), Accessories (Max 12%). Prevent compounding deductions from driving value below an 8% baseline resale floor.</div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <Database className="w-5 h-5 text-cobalt" />
              4. Core Relational Data Schema
            </div>
            <p className="font-light text-xs">A relational model binds brands, models, specific variants, defect rules, and customer bookings together:</p>
            <div className="bg-zinc-950 p-4 rounded-sm border border-ice-border text-xs font-mono overflow-x-auto text-zinc-300">
              {`BRANDS (id, name, logo)\n└── MODELS (id, brand_id, name, category, release_year)\n    ├── DEVICE_VARIANTS (id, model_id, storage_gb, color, base_price)\n    └── DEFECT_RULES (id, category, description, fixed, percentage, is_critical)\n        └── TRADE_IN_BOOKINGS (id, variant_id, customer_name, customer_phone, final_quote, address)`}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-ice-border bg-canvas-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm transition-all"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FAQ Section Component ─────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'How do I know the price is genuine?',
    a: 'Our pricing engine computes quotes using market-calibrated base prices and documented deduction rules. The price you see is the price you get — we never renegotiate at pickup unless device condition is materially different from what you reported.',
  },
  {
    q: 'How quickly will I receive payment?',
    a: 'Payment is processed within minutes of our executive completing the on-site verification at your doorstep. UPI and bank transfers are instant. Cash arrangements are also available on request.',
  },
  {
    q: 'Is my personal data safe after the trade?',
    a: 'Every device undergoes a military-grade (DoD 5220.22-M) secure erase before leaving your premises. We provide a certified data destruction certificate on request. We never access your personal files.',
  },
  {
    q: 'What if I change my mind after booking?',
    a: 'You can cancel or reschedule your pickup at any time up to 2 hours before the scheduled slot at no charge. Your quote is locked for 7 days so you can rebook whenever suits you.',
  },
  {
    q: 'Which cities do you currently operate in?',
    a: 'We currently service Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, and Pune. Coverage is expanding — contact us if you\'re in another city and we\'ll check availability.',
  },
  {
    q: 'Can I sell multiple devices at once?',
    a: 'Yes! For bulk (3+ devices) or corporate liquidations, contact our B2B team for a customized quote, certified bulk data wiping, and dedicated logistics support.',
  },
  {
    q: 'What devices do you accept?',
    a: 'We accept iPhones (up to 6 years old), Samsung Galaxy S and A series, OnePlus, Google Pixel, and Motorola devices. We continuously expand our catalog — if your model is not listed, reach out via our helpdesk.',
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="py-8 border-t border-ice-border/40">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary mb-4 tracking-wide uppercase">Frequently Asked</span>
        <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight">Common Questions</h2>
        <p className="text-ink-slate mt-2 text-sm font-light">Everything you need to know before selling your device.</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border border-ice-border rounded-xl overflow-hidden bg-canvas-pure">
            <button
              id={`faq-btn-${i}`}
              aria-expanded={openIdx === i}
              aria-controls={`faq-panel-${i}`}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-ice-gray/50 transition-colors"
            >
              <span className="text-sm font-semibold text-ink-navy">{item.q}</span>
              <svg
                className={`w-5 h-5 text-ink-muted flex-shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-45' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {openIdx === i && (
              <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className="px-5 pb-5 text-sm text-ink-slate font-light leading-relaxed border-t border-ice-border/40 pt-4 animate-fadeIn">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Navigation state — persisted in localStorage with TTL (non-sensitive) ──
  const savedNav = useRef(loadNavState());
  const [activeStage, setActiveStage] = useState<'select' | 'tablets' | 'diagnose' | 'schedule' | 'admin'>(
    (window.location.pathname === SECRET_ADMIN_PATH || window.location.pathname === '/admin')
      ? 'admin'
      : (savedNav.current?.activeStage === 'admin' ? 'select' : savedNav.current?.activeStage ?? 'select')
  );
  const [wizardStep, setWizardStep] = useState<number>(savedNav.current?.wizardStep ?? 0);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [path, setPath] = useState(window.location.pathname);

  // Decoy admin route trap: Redirect probes like /admin, /wp-admin to homepage
  useEffect(() => {
    const cleanP = path.split('?')[0].toLowerCase();
    if (DECOY_ADMIN_PATHS.includes(cleanP)) {
      console.warn(`[Security Alert] Decoy admin path probe blocked: ${path}`);
      navigate('/');
    }
  }, [path]);

  // Secret Hotkey (Ctrl + Shift + A) to open secret admin portal for staff
  useEffect(() => {
    const handleAdminHotkey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate(SECRET_ADMIN_PATH);
      }
    };
    window.addEventListener('keydown', handleAdminHotkey);
    return () => window.removeEventListener('keydown', handleAdminHotkey);
  }, []);

  // Customer Session states
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch customer session on startup & Listen for Firebase Auth state changes
  useEffect(() => {
    fetchCurrentUser()
      .then(res => {
        if (res?.user) {
          setCurrentUser(res.user);
        }
      })
      .catch(() => { /* Guest visitor */ });

    checkRedirectAuthResult().catch(() => {});

    const unsubscribe = subscribeToFirebaseAuth(async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const synced = await syncFirebaseUser(token);
          if (synced && synced.user) {
            setCurrentUser(synced.user);
            return;
          }
        } catch (syncErr) {
          console.warn('[Firebase Auth] Background sync warning:', syncErr);
        }

        setCurrentUser({
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || null,
          picture: fbUser.photoURL || null,
          emailVerified: Boolean(fbUser.emailVerified),
          hasGoogleLinked: true,
          hasPassword: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Automatically redirect if user logs in while on /login or /signup
  useEffect(() => {
    if (currentUser && (path.startsWith('/login') || path.startsWith('/signup'))) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect === 'booking') {
        navigate('/smartphones');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, path]);

  // Restore pending booking flow if user logs in
  useEffect(() => {
    if (currentUser) {
      const pendingData = localStorage.getItem('pending_booking_flow');
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData);
          if (parsed.selectedModel) {
            setSelectedModel(parsed.selectedModel);
          }
          if (parsed.selectedVariant) {
            setSelectedVariant(parsed.selectedVariant);
          }
          if (parsed.selectedDefects) {
            setSelectedDefects(parsed.selectedDefects);
          }
          if (parsed.finalPrice) {
            setFinalPrice(parsed.finalPrice);
          }
          if (parsed.wizardStep) {
            setWizardStep(parsed.wizardStep);
          }
          if (parsed.activeStage) {
            setActiveStage(parsed.activeStage);
          }
          localStorage.removeItem('pending_booking_flow');
          showToast('Resumed your device selling workflow.', 'info');
        } catch (err) {
          console.error('Failed to restore pending booking flow:', err);
        }
      }
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await customerLogout();
      setCurrentUser(null);
      showToast('Logged out successfully.', 'info');
      navigate('/');
    } catch (err: any) {
      showToast('Logout failed: ' + (err.message || err), 'error');
    }
  };

  const navigate = (newPath: string) => {
    startTransition(() => {
      window.history.pushState({}, '', newPath);
      setPath(newPath);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  const getPathForModel = (model: Model): string => {
    if (isTabletDevice(model.brandId, model.name, model.id)) return '/tablets';
    return '/smartphones';
  };

  useEffect(() => {
    let title = "Rephonix | Sell Your Devices at the Best Price";
    const cleanPath = path.split('?')[0];
    switch (cleanPath) {
      case '/smartphones':
        title = "Sell Smartphones | Rephonix";
        break;
      case '/tablets':
        title = "Sell Tablets & iPads | Rephonix";
        break;
      case '/about':
        title = "About Rephonix";
        break;
      case '/contact':
        title = "Contact Rephonix";
        break;
      case SECRET_ADMIN_PATH:
        title = "Control Center | Rephonix";
        break;
      case '/login':
        title = "Login | Rephonix";
        break;
      case '/signup':
        title = "Create Account | Rephonix";
        break;
      case '/forgot-password':
        title = "Forgot Password | Rephonix";
        break;
      case '/reset-password':
        title = "Reset Password | Rephonix";
        break;
      case '/verify-email':
        title = "Verify Email | Rephonix";
        break;
      case '/profile':
        title = "My Profile | Rephonix";
        break;
    }
    document.title = title;
  }, [path]);

  // Sync activeStage with secret admin path
  useEffect(() => {
    startTransition(() => {
      if (path === SECRET_ADMIN_PATH) {
        setActiveStage('admin');
      } else if (activeStage === 'admin') {
        setActiveStage('select');
      }
    });
  }, [path, activeStage]);

  // ── Dynamic data from API (falls back to static catalog data) ──────────────
  // MODELS and BRANDS start empty — the catalog data module is loaded
  // dynamically so it does not block the initial JS bundle parse.
  const [BRANDS, setBrands] = useState<Brand[]>([]);
  const [MODELS, setModels] = useState<Model[]>(() => {
    const cached = getCachedModels();
    return cached.length > 0 ? (cached as Model[]) : [];
  });
  const [apiBookings, setApiBookings] = useState<Booking[]>([]);
  // catalogReady tracks when the async catalog chunk has resolved
  const catalogReadyRef = useRef(false);

  const [orderVersion, setOrderVersion] = useState(0);

  useEffect(() => {
    const handleOrderChange = () => setOrderVersion(v => v + 1);
    window.addEventListener('stc_catalog_order_changed', handleOrderChange);
    return () => window.removeEventListener('stc_catalog_order_changed', handleOrderChange);
  }, []);

  const orderedBrands = useMemo(() => {
    return applyBrandOrder(BRANDS);
  }, [BRANDS, orderVersion]);


  const refreshCatalog = useCallback(async () => {
    try {
      const [brandsRes, modelsRes] = await Promise.allSettled([fetchBrands(), fetchModels()]);
      if (brandsRes.status === 'fulfilled' && brandsRes.value.length > 0) {
        setBrands(brandsRes.value);
      }
      if (modelsRes.status === 'fulfilled' && modelsRes.value.length > 0) {
        setModels(modelsRes.value as Model[]);
      }
    } catch {
      console.info('[App] API unavailable, using static catalog data');
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    if (!hasAdminToken()) return;
    try {
      const bookings = await apiFetchBookings();
      if (bookings.length > 0) setApiBookings(bookings as unknown as Booking[]);
    } catch {
      console.info('[App] API unavailable, using initial bookings');
    }
  }, []);

  // ── Lazy-load the heavy catalog data module (deferred from initial bundle) ──
  // Runs once on mount. The dynamic import pulls mockDatabase + phoneImages.json
  // + actualPrices.json as a separate JS chunk, keeping Time-To-Interactive fast.
  useEffect(() => {
    let cancelled = false;
    import('./data/mockDatabase').then((db) => {
      if (cancelled) return;
      // Only use static data as fallback if the API didn't already populate state
      setBrands(prev => prev.length === 0 ? db.BRANDS : prev);
      setModels(prev => {
        if (prev.length > 0) return prev;
        const cached = getCachedModels();
        return cached.length > 0 ? (cached as Model[]) : (db.MODELS as Model[]);
      });
      setApiBookings(prev => prev.length === 0 ? db.INITIAL_BOOKINGS : prev);
      catalogReadyRef.current = true;
    }).catch(() => {
      console.warn('[App] Failed to load catalog data module');
      catalogReadyRef.current = true;

    });
    // Also run API refresh in parallel
    refreshCatalog();
    refreshBookings();
    return () => { cancelled = true; };
  }, [refreshCatalog, refreshBookings]);

  // ── Sensitive state — persisted across reload with 24h TTL ────────────────────────
  // Note: STATIC_MODELS not available at startup (catalog loads dynamically).
  // The useEffect below restores model state once catalog resolves.
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    const nav = savedNav.current;
    if (nav?.selectedVariant) return nav.selectedVariant;
    return null;
  });

  const [selectedDefects, setSelectedDefects] = useState<DefectRule[]>([]);


  const [finalPrice, setFinalPrice] = useState<number>(() => {
    const nav = savedNav.current;
    if (typeof nav?.finalPrice === 'number' && nav.finalPrice > 0) return nav.finalPrice;
    return 0;
  });

  // Sync API models once catalog loads if model ID is valid
  // Also restores selectedVariant and selectedDefects since the catalog now loads async.
  useEffect(() => {
    if (savedNav.current?.selectedModelId && MODELS.length > 0) {
      const nav = savedNav.current;
      const apiModel = MODELS.find(m => m.id === nav.selectedModelId && !m.hidden);
      if (apiModel) {
        setSelectedModel(apiModel);
        // Restore variant from saved nav
        if (nav.selectedVariant) {
          setSelectedVariant(nav.selectedVariant);
        } else {
          const variants = generateVariantsForModel(apiModel);
          setSelectedVariant(variants[0] || null);
        }
        // Restore defects from saved nav
        if (nav.selectedDefectIds && nav.selectedDefectIds.length > 0) {
          const rules = getDefectRulesForCategory(apiModel.category, apiModel.brandId, apiModel.name, apiModel.id);
          setSelectedDefects(rules.filter(r => nav.selectedDefectIds!.includes(r.id)));
        }
      } else if (MODELS.some(m => m.id === nav.selectedModelId && m.hidden)) {
        setSelectedModel(null);
        setSelectedVariant(null);
        setActiveStage('select');
      }
    }
  }, [MODELS]);

  // Auto-persist active workflow state to localStorage whenever workflow state updates
  useEffect(() => {
    if (activeStage === 'diagnose' || activeStage === 'schedule') {
      if (selectedModel) {
        saveNavState({
          activeStage,
          wizardStep,
          selectedModelId: selectedModel.id,
          selectedVariant: selectedVariant || undefined,
          selectedDefectIds: selectedDefects.map(d => d.id),
          finalPrice,
        });
      }
    } else if (activeStage === 'admin') {
      saveNavState({ activeStage: 'admin', wizardStep: 0 });
    } else {
      clearNavState();
    }
  }, [activeStage, wizardStep, selectedModel, selectedVariant, selectedDefects, finalPrice]);

  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', title: string = 'Notice') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hero search state
  const [heroSearch, setHeroSearch] = useState('');
  const [heroSearchOpen, setHeroSearchOpen] = useState(false);
  const [pendingModelId, setPendingModelId] = useState<string | null>(null);
  const [pendingBrandId, setPendingBrandId] = useState<string | null>(null);
  const [trackModalTab, setTrackModalTab] = useState<'my_bookings' | 'track_search' | 'invoices'>('my_bookings');
  const heroSearchRef = useRef<HTMLDivElement>(null);

  const heroSearchResults = useMemo(() => {
    if (heroSearch.trim().length < 2) return [];
    const q = heroSearch.toLowerCase().trim();
    // Strip all spaces for compact-query matching: "iphone15" → matches "iPhone 15"
    const qCompact = q.replace(/\s+/g, '');

    return MODELS.filter(m => {
      // Never show hidden models in public search
      if (m.hidden) return false;
      const brand = BRANDS.find(b => b.id === m.brandId);
      const brandName = brand ? brand.name.toLowerCase() : '';
      const modelName = m.name.toLowerCase();
      const seriesName = m.series ? m.series.toLowerCase() : '';
      const fullText = `${brandName} ${modelName} ${seriesName}`.toLowerCase();
      // Space-stripped versions for compact queries (e.g. "iphone15" → "iphone 15")
      const modelNameCompact = modelName.replace(/\s+/g, '');
      const fullTextCompact  = fullText.replace(/\s+/g, '');

      let brandAliases: string[] = [brandName];
      if (m.brandId === 'brand-apple' || brandName === 'apple') {
        brandAliases.push('apple', 'iphone', 'ios');
      } else if (m.brandId === 'brand-samsung' || brandName === 'samsung') {
        brandAliases.push('samsung', 'galaxy');
      } else if (m.brandId === 'brand-google' || brandName === 'google') {
        brandAliases.push('google', 'pixel');
      } else if (m.brandId === 'brand-oneplus' || brandName === 'oneplus') {
        brandAliases.push('oneplus', '1plus', 'nord');
      } else if (m.brandId === 'brand-xiaomi' || brandName === 'xiaomi') {
        brandAliases.push('xiaomi', 'mi', 'redmi', 'poco');
      } else if (m.brandId === 'brand-vivo' || brandName === 'vivo') {
        brandAliases.push('vivo', 'iqoo');
      }

      return (
        fullText.includes(q) ||
        modelName.includes(q) ||
        seriesName.includes(q) ||
        brandAliases.some(alias => alias.includes(q)) ||
        // Compact matching: strip spaces so "iphone15" finds "iPhone 15"
        (qCompact.length >= 2 && (fullTextCompact.includes(qCompact) || modelNameCompact.includes(qCompact)))
      );
    }).slice(0, 10);
  }, [heroSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setHeroSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHeroSearchSelect = (model: Model) => {
    setHeroSearch('');
    setHeroSearchOpen(false);
    setPendingModelId(model.id);
    const targetPath = getPathForModel(model);
    handleReset();
    navigate(targetPath);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('admin') === '1') {
      setActiveStage('admin');
    }
  }, []);

  // Persist only non-sensitive navigation hints
  useEffect(() => {
    // If user is at 'select' stage with default step, don't clutter storage
    if ((activeStage === 'select' || activeStage === 'admin') && wizardStep === 0) {
      clearNavState();
    } else {
      saveNavState({ activeStage, wizardStep });
    }
  }, [activeStage, wizardStep]);

  const handleVariantSelected = (model: Model, variant: Variant) => {
    startTransition(() => {
      setSelectedModel(model);
      setSelectedVariant(variant);
      setSelectedDefects([]);
      setWizardStep(0);
      setFinalPrice(variant.basePrice);
      setActiveStage('diagnose');
      
      const targetPath = getPathForModel(model);
      navigate(targetPath);
    });
  };

  const handleDirectSelectModel = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId && !m.hidden);
    if (model) {
      const variants = generateVariantsForModel(model);
      if (variants && variants.length > 0) {
        handleVariantSelected(model, variants[0]);
      }
    }
  };

  const handleDiagnosticsComplete = (price: number, defects: DefectRule[]) => {
    startTransition(() => {
      setFinalPrice(price);
      setSelectedDefects(defects);
      setActiveStage('schedule');
    });
  };

  const [selectedTabletBrand, setSelectedTabletBrand] = useState<'all' | 'apple' | 'samsung'>('all');

  const handleReset = () => {
    startTransition(() => {
      setSelectedModel(null);
      setSelectedVariant(null);
      setSelectedDefects([]);
      setFinalPrice(0);
      setWizardStep(0);
      setActiveStage('select');
      setSelectedTabletBrand('all');
      clearNavState();
    });
  };

  const isWorkflow = (activeStage === 'diagnose' || activeStage === 'schedule') && 
                     selectedModel !== null && selectedVariant !== null;

  const cleanPath = path.split('?')[0];

  if (import.meta.env.VITE_COMING_SOON === 'true') {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-canvas-white text-ink-navy flex flex-col font-sans selection:bg-cobalt selection:text-white">

      {/* ── Pilot Mode Announcement Ticker Marquee ──────────────────── */}
      {PILOT_MODE_ENABLED && <PilotModeBanner onOpenFeedback={() => setIsFeedbackModalOpen(true)} />}

      {/* ── Consolidated Header Navigation ─────────────────────────── */}
      <HeaderNav
        currentPath={cleanPath}
        onNavigate={(p) => { handleReset(); navigate(p); }}
        onSelectBrand={(brandId) => {
          handleReset();
          setPendingModelId(null);
          setPendingBrandId(brandId);
          setActiveStage('select');
          navigate('/smartphones');
        }}
        onSelectTabletBrand={(brand) => {
          handleReset();
          setSelectedTabletBrand(brand);
          navigate('/tablets');
        }}
        onSelectModel={(modelId) => {
          handleReset();
          handleDirectSelectModel(modelId);
        }}
        models={MODELS}
        onOpenTrackOrder={() => startTransition(() => { setTrackModalTab('my_bookings'); setIsTrackOpen(true); })}
        onOpenInvoices={() => startTransition(() => { setTrackModalTab('invoices'); setIsTrackOpen(true); })}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* ── Main Layout ── */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 ${!isWorkflow ? 'max-w-7xl flex flex-col' : 'max-w-7xl flex flex-col xl:grid xl:grid-cols-12 gap-6 xl:gap-8 items-start'}`}>

        {/* Active Stage Content Area */}
        <section className={!isWorkflow ? 'w-full space-y-16' : 'w-full xl:col-span-9 space-y-4 sm:space-y-6 min-w-0'}>

          {path.startsWith('/login') && (
            <LoginPage
              onLoginSuccess={(user) => setCurrentUser(user)}
              onNavigate={navigate}
              redirectParam={new URLSearchParams(window.location.search).get('redirect')}
            />
          )}

          {path.startsWith('/signup') && (
            <SignupPage
              onSignupSuccess={(user) => setCurrentUser(user)}
              onNavigate={navigate}
              redirectParam={new URLSearchParams(window.location.search).get('redirect')}
            />
          )}

          {path.startsWith('/forgot-password') && (
            <ForgotPasswordPage onNavigate={navigate} />
          )}

          {path.startsWith('/reset-password') && (
            <ResetPasswordPage
              onNavigate={navigate}
              tokenParam={new URLSearchParams(window.location.search).get('token')}
            />
          )}

          {path.startsWith('/verify-email') && (
            <VerifyEmailPage
              onNavigate={navigate}
              tokenParam={new URLSearchParams(window.location.search).get('token')}
            />
          )}

          {path.startsWith('/profile') && currentUser && (
            <ProfilePage
              user={currentUser}
              onLogout={handleLogout}
              onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
              onNavigate={navigate}
              models={MODELS}
            />
          )}

          {path.startsWith('/profile') && !currentUser && (
            <LoginPage
              onLoginSuccess={(user) => setCurrentUser(user)}
              onNavigate={navigate}
            />
          )}

          {cleanPath === '/about' && <AboutPage />}

          {cleanPath === '/contact' && <ContactPage onShowToast={showToast} />}

          {cleanPath === '/tablets' && !isWorkflow && (
            <TabletsShowcase
              models={MODELS}
              onSelectVariant={handleVariantSelected}
              onBackToHome={() => { handleReset(); navigate('/'); }}
              defaultBrand={selectedTabletBrand}
            />
          )}



          {cleanPath === '/smartphones' && !isWorkflow && (
            <div className="bg-canvas-pure border border-ice-border/60 rounded-xl p-5 sm:p-8 shadow-3d-card scroll-mt-24 mb-12">
              <div className="mb-8 pb-5 border-b border-ice-border/40 text-left">
                <span className="text-[10px] font-mono tracking-[0.2em] text-cobalt font-bold uppercase block mb-1">
                  Catalog / Hardware Selector
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight font-outfit">
                  Select Brand &amp; Model
                </h3>
              </div>
              <DeviceSelector
                onVariantSelected={handleVariantSelected}
                defaultBrandId={pendingBrandId}
                onDefaultBrandConsumed={() => setPendingBrandId(null)}
                defaultModelId={pendingModelId}
                onDefaultModelConsumed={() => setPendingModelId(null)}
                brands={BRANDS}
                models={MODELS}
              />
            </div>
          )}

          {cleanPath === '/' && (
            <div className="space-y-20 pt-4 pb-12 sm:pt-6 sm:pb-16">
              {/* 1. Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Hero Call to Action */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary mb-6 tracking-wide uppercase">
                    ★ #1 Trusted Resale Partner
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink-navy tracking-tight leading-none mb-6">
                    Sell Your Smartphone <br className="hidden sm:inline" />for the <span className="text-secondary">Best Price</span>
                  </h1>
                  <p className="text-base sm:text-lg text-ink-slate mb-8 max-w-xl font-light leading-relaxed">
                    Get an instant valuation, free doorstep pickup, and instant cash payment. No hidden deductions, guaranteed.
                  </p>

                  {/* Brand Logo Quick-Select Pills — 5 cols × 2 rows */}
                  {orderedBrands.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mb-5">
                      {orderedBrands.map(brand => (
                        <button
                          key={brand.id}
                          onClick={() => {
                            handleReset();
                            setPendingModelId(null);
                            setPendingBrandId(brand.id);
                            navigate('/smartphones');
                          }}
                          title={brand.name}
                          className="flex items-center justify-center px-2 py-3 rounded-xl bg-canvas-pure border border-ice-border hover:border-cobalt/50 hover:shadow-sm text-ink-slate hover:text-cobalt transition-all duration-200 cursor-pointer overflow-hidden"
                        >
                          <BrandLogo logo={brand.logo} isActive={false} />
                        </button>
                      ))}
                      <button
                        onClick={() => { handleReset(); navigate('/smartphones'); setPendingModelId(null); }}
                        title="View all brands"
                        className="flex items-center justify-center py-3 text-ink-slate hover:text-cobalt font-bold text-xs sm:text-sm tracking-tight transition-colors duration-200 cursor-pointer select-none"
                      >
                        <span>&amp; more brands</span>
                      </button>
                    </div>
                  )}

                  {/* Functional Hero Search Bar with live dropdown */}
                  <div ref={heroSearchRef} className="w-full max-w-lg relative mb-8">
                    <div className="bg-canvas-pure p-2 rounded-lg border border-ice-border flex items-center gap-2 shadow-sm">
                      <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-ink-muted absolute left-3 top-3.5" />
                        <input
                          id="hero-search"
                          type="text"
                          placeholder="Search model (e.g. iPhone 15 Pro, Galaxy S24)..."
                          value={heroSearch}
                          onChange={e => { setHeroSearch(e.target.value); setHeroSearchOpen(true); }}
                          onFocus={() => setHeroSearchOpen(true)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setHeroSearchOpen(false);
                              if (heroSearch.trim()) {
                                handleReset();
                                navigate(`/smartphones?q=${encodeURIComponent(heroSearch.trim())}`);
                              } else {
                                handleReset();
                                navigate('/smartphones');
                              }
                            }
                          }}
                          className="w-full pl-10 pr-4 py-3 text-sm bg-transparent text-ink-navy placeholder:text-ink-muted focus:outline-none"
                          aria-label="Search for a smartphone model"
                          autoComplete="off"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setHeroSearchOpen(false);
                          if (heroSearch.trim()) {
                            handleReset();
                            navigate(`/smartphones?q=${encodeURIComponent(heroSearch.trim())}`);
                          } else {
                            handleReset();
                            navigate('/smartphones');
                          }
                        }}
                        className="bg-cobalt hover:bg-cobalt-hover text-white px-5 py-3 rounded-sm text-sm font-semibold transition-all shadow-sm flex-shrink-0"
                      >
                        Find My Device
                      </button>
                    </div>

                    {/* Live search results dropdown */}
                    {heroSearchOpen && heroSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-canvas-pure border border-ice-border rounded-sm shadow-premium z-30 overflow-hidden animate-fadeIn">
                        {heroSearchResults.map(model => {
                          const brand = BRANDS.find(b => b.id === model.brandId);
                          return (
                            <button
                              key={model.id}
                              onClick={() => handleHeroSearchSelect(model)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cobalt-light/30 transition-colors text-left border-b border-ice-border/40 last:border-0 group"
                            >
                              <div className="w-8 h-8 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {brand ? (
                                  <BrandLogo logo={brand.logo} isActive={false} />
                                ) : (
                                  <span className="text-[10px] font-bold text-cobalt">??</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-ink-navy group-hover:text-cobalt transition-colors truncate">{model.name}</span>
                                <span className="block text-[10px] text-ink-muted font-mono">{brand?.name} · Up to ₹{getMaxVariantPrice(model).toLocaleString('en-IN')}</span>
                              </div>
                              <svg className="w-4 h-4 text-ink-muted group-hover:text-cobalt transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          );
                        })}
                        <div className="px-4 py-2 text-[10px] text-ink-muted font-mono border-t border-ice-border/40 bg-canvas-white">
                          Showing {heroSearchResults.length} result{heroSearchResults.length !== 1 ? 's' : ''} — or <button onClick={() => { setHeroSearchOpen(false); handleReset(); navigate('/smartphones'); }} className="text-cobalt underline">browse all models</button>
                        </div>
                      </div>
                    )}
                    {heroSearchOpen && heroSearch.trim().length >= 2 && heroSearchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-canvas-pure border border-ice-border rounded-sm shadow-premium z-30 px-4 py-4 text-sm text-ink-muted text-center animate-fadeIn">
                        No models found for <span className="font-mono text-cobalt">"{heroSearch}"</span>.
                        <button onClick={() => { setHeroSearchOpen(false); handleReset(); navigate('/smartphones'); }} className="block text-xs text-cobalt mt-1 underline mx-auto">Browse all models instead →</button>
                      </div>
                    )}
                  </div>

                  {/* Trust Badge Indicators */}
                  <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-ink-slate">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-ice-border shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</div>
                      <span className="font-outfit text-ink-navy">Secure &amp; Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-ice-border shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</div>
                      <span className="font-outfit text-ink-navy">Instant Payout</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-ice-border shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</div>
                      <span className="font-outfit text-ink-navy">Free Doorstep Pickup</span>
                    </div>
                  </div>
                </div>

                {/* Hero Interactive Phone Panel Graphic */}
                <div className="lg:col-span-5 flex justify-center">
                  <Suspense fallback={
                    <div className="w-full max-w-sm h-96 border border-ice-border rounded-3xl bg-slate-50/50 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    <SmartphoneMockup onSelect={() => { handleReset(); navigate('/smartphones'); }} />
                  </Suspense>
                </div>
              </div>

              {/* 1.5 Premium 3D Device Category Showcase */}
              <DeviceCategoryShowcase
                onSelectCategory={(cat) => {
                  if (cat === 'tablets') {
                    handleReset();
                    navigate('/tablets');
                  } else {
                    handleReset();
                    navigate('/smartphones');
                  }
                }}
              />

              {/* CURATED FEATURED DEVICES SECTION */}
              <div className="space-y-8 py-4">
                <div className="text-center max-w-3xl mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/15 tracking-widest uppercase font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" /> Curated Trending Models
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight mt-3">
                    Featured Selling Devices
                  </h2>
                  <p className="text-ink-slate mt-2 text-sm sm:text-base font-light">
                    Select a popular model directly to get an instant doorstep payout valuation.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { id: 'apple-17pm', brand: 'Apple', name: 'iPhone 17 Pro Max' },
                    { id: 'apple-17air', brand: 'Apple', name: 'iPhone 17 Air' },
                    { id: 'sam-s24u', brand: 'Samsung', name: 'Galaxy S24 Ultra' },
                    { id: 'apple-16pm', brand: 'Apple', name: 'iPhone 16 Pro Max' },
                  ].map((dev) => {
                    const modelObj = MODELS.find(m => m.id === dev.id);
                    const priceVal = modelObj ? getMaxVariantPrice(modelObj) : 0;
                    const priceStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(priceVal);
                    const imgUrl = getDeviceImage(dev.id, dev.id.startsWith('apple') ? 'brand-apple' : 'brand-samsung');
                    return (
                      <div
                        key={dev.id}
                        onClick={() => handleDirectSelectModel(dev.id)}
                        className="bg-canvas-pure border border-ice-border/60 hover:border-cobalt hover:shadow-premium rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cobalt/5 blur-2xl rounded-full pointer-events-none group-hover:bg-cobalt/10 transition-all" />
                        
                        {/* Device Image */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4 relative z-10 transition-transform group-hover:scale-105 duration-300">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={dev.name}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full object-contain filter drop-shadow-md"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full rounded bg-ice-gray flex items-center justify-center text-ink-muted text-[10px]">
                              {dev.name}
                            </div>
                          )}
                        </div>

                        {/* Device Title details */}
                        <div className="space-y-1 relative z-10 w-full text-center">
                          <span className="text-[9px] font-mono font-bold tracking-wider text-ink-muted uppercase block">{dev.brand}</span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-ink-navy group-hover:text-cobalt transition-colors font-outfit truncate w-full">
                            {dev.name}
                          </h4>
                          <div className="pt-2 border-t border-ice-border/40 mt-2">
                            <span className="text-[9px] font-mono text-ink-slate font-light uppercase block">Valuations Up To</span>
                            <span className="text-xs sm:text-sm font-black text-emerald-600 font-outfit">{priceStr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1.6 Sell Your Device Section */}
              <SellYourDevice
                currentUser={currentUser}
                onGetValuation={() => {
                  handleReset();
                  navigate('/smartphones');
                }}
              />

              {/* 3. How It Works Section */}
              <div id="how-it-works-section" className="py-12 border-t border-b border-ice-border/40">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl sm:text-4xl font-black text-ink-navy tracking-tight font-outfit">How it Works</h2>
                  <p className="text-ink-slate mt-2 text-base font-light">Our transparent process ensures you get the highest value with zero doorstep friction.</p>
                </div>

                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-16 left-4 right-4 h-0.5 bg-ice-gray hidden md:block z-0"></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center group">
                      <div className="w-16 h-16 rounded-2xl bg-cobalt text-white flex items-center justify-center text-xl font-black shadow-lg shadow-cobalt/20 mb-6 group-hover:scale-110 transition-transform duration-300 font-outfit">
                        1
                      </div>
                      <h3 className="text-xl font-extrabold text-ink-navy mb-2 font-outfit">Check Price</h3>
                      <p className="text-sm text-ink-slate max-w-xs font-light leading-relaxed">
                        Select your smartphone model and answer a few questions about its condition. Get a quote instantly.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center group">
                      <div className="w-16 h-16 rounded-2xl bg-cobalt text-white flex items-center justify-center text-xl font-black shadow-lg shadow-cobalt/20 mb-6 group-hover:scale-110 transition-transform duration-300 font-outfit">
                        2
                      </div>
                      <h3 className="text-xl font-extrabold text-ink-navy mb-2 font-outfit">Schedule Pickup</h3>
                      <p className="text-sm text-ink-slate max-w-xs font-light leading-relaxed">
                        Choose a convenient date and time slot. Our executive will visit your home or office for verification.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center group">
                      <div className="w-16 h-16 rounded-2xl bg-cobalt text-white flex items-center justify-center text-xl font-black shadow-lg shadow-cobalt/20 mb-6 group-hover:scale-110 transition-transform duration-300 font-outfit">
                        3
                      </div>
                      <h3 className="text-xl font-extrabold text-ink-navy mb-2 font-outfit">Get Paid</h3>
                      <p className="text-sm text-ink-slate max-w-xs font-light leading-relaxed">
                        Once condition is verified at your doorstep, get paid instantly via digital bank transfer or UPI.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Benefits Section — Executive Luxury Bento & Command Telemetry ── */}
              <div className="py-12">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 shadow-sm tracking-widest uppercase font-outfit">
                    <Sparkles className="w-3.5 h-3.5 text-cobalt" /> Why Rephonix
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight mt-3 font-outfit">
                    Designed Around You. Built for Absolute Trust.
                  </h2>
                  <p className="text-ink-slate mt-3 text-base max-w-xl mx-auto font-light leading-relaxed">
                    No hidden cuts. No delayed payments. Engineered to give you maximum device value with zero doorstep friction.
                  </p>
                </div>

                {/* Executive 4-Card Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                  {/* Card 1: Instant Payout */}
                  <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-[#001c3d] via-[#002652] to-[#00142e] border border-blue-500/30 p-6 text-white shadow-xl hover:shadow-2xl hover:border-blue-400/60 transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/35 transition-all duration-500 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <Zap className="w-6 h-6 fill-blue-400/20 stroke-[2.2]" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 tracking-wider">
                          SUB-60s PAYOUT
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight font-outfit">Instant Payout</h3>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">
                        Cash transfer or instant UPI within 60 seconds of doorstep verification — right before our executive leaves your presence.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-medium text-blue-300/90">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Direct UPI &amp; IMPS Settlement</span>
                    </div>
                  </div>

                  {/* Card 2: Zero Hidden Cuts — Clean Slate Glass with Emerald Accent */}
                  <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-white via-emerald-50/20 to-white border border-emerald-200/80 p-6 shadow-md hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                          <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200 tracking-wider">
                          GUARANTEED
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-ink-navy mb-2 tracking-tight">Zero Hidden Cuts</h3>
                      <p className="text-sm text-ink-slate font-light leading-relaxed">
                        The price quoted online is exact. Zero last-minute renegotiation, surprise fees, or arbitrary doorstep price reductions.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Binding Price Protection Guarantee</span>
                    </div>
                  </div>

                  {/* Card 3: Free Doorstep Pickup — Executive Indigo Accent Card */}
                  <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-white via-indigo-50/20 to-white border border-indigo-200/80 p-6 shadow-md hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                          <Truck className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-100/90 text-indigo-800 border border-indigo-200 tracking-wider">
                          FREE PICKUP
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-ink-navy mb-2 tracking-tight">Free Doorstep Pickup</h3>
                      <p className="text-sm text-ink-slate font-light leading-relaxed">
                        Our verified executive visits your home or office at a time slot of your choice. Completely free, always — across India.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-indigo-100 flex items-center gap-2 text-xs font-semibold text-indigo-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Flexible 2-Hour Window Slots</span>
                    </div>
                  </div>

                  {/* Card 4: Certified Data Wipe — Dark Slate Obsidian with Gold Metallic Accent */}
                  <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-amber-500/30 p-6 text-white shadow-xl hover:shadow-2xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all duration-500 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <Lock className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 tracking-wider">
                          ENTERPRISE SECURE
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Certified Data Wipe</h3>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">
                        NIST SP 800-88 compliant secure data erasure performed on every device with a digital certificate before it leaves your hands.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-medium text-amber-300/90">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Digital Erasure Certificate Issued</span>
                    </div>
                  </div>

                </div>

                {/* High-Impact Executive Command Telemetry Ticker */}
                <div className="mt-12 bg-gradient-to-r from-[#001736] via-[#00224d] to-[#001736] border border-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  {/* Subtle Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />
                  
                  {/* Live Telemetry Status Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                        PLATFORM METRICS
                      </span>
                    </div>
                  </div>

                  {/* 4 Metric Columns */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 text-center sm:text-left">
                    <div className="sm:border-r sm:border-white/10 sm:pr-4">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-outfit">Delhi NCR</div>
                      <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mt-1">Exclusive Service Area</div>
                    </div>

                    <div className="lg:border-r lg:border-white/10 lg:pr-4">
                      <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight font-outfit">₹1.8 Cr+</div>
                      <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mt-1">Paid to Sellers</div>
                    </div>

                    <div className="sm:border-r sm:border-white/10 sm:pr-4">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-outfit">98.5%</div>
                      <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mt-1">Quote Match Rate</div>
                    </div>

                    <div>
                      <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight font-outfit">Min 3 Days</div>
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mt-1">Scheduled Pickup</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Testimonials ──────────────────────────────────────────── */}
              <div className="py-8 border-t border-ice-border/40">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary mb-4 tracking-wide uppercase">Customer Stories</span>
                  <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight">Trusted by Thousands</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      name: 'Priya Mehta',
                      city: 'Mumbai',
                      avatar: 'PM',
                      rating: 5,
                      device: 'iPhone 14 Pro Max',
                      quote: 'Got ₹48,000 for my iPhone in under 20 minutes. The agent was punctual, polite, and the UPI transfer hit my account before he even left!',
                      color: 'bg-blue-100 text-blue-700',
                    },
                    {
                      name: 'Rohit Sharma',
                      city: 'Bangalore',
                      avatar: 'RS',
                      rating: 5,
                      device: 'Samsung Galaxy S23 Ultra',
                      quote: 'Skeptical at first, but they actually gave me ₹500 MORE than quoted because my condition was better than I described. Unbelievable honesty.',
                      color: 'bg-emerald-100 text-emerald-700',
                    },
                    {
                      name: 'Ananya Iyer',
                      city: 'Chennai',
                      avatar: 'AI',
                      rating: 5,
                      device: 'OnePlus 12',
                      quote: 'Sold 3 company phones through Rephonix for our office upgrade. Bulk pricing was great and the data wipe certificate gave us peace of mind.',
                      color: 'bg-purple-100 text-purple-700',
                    },
                  ].map(t => (
                    <div key={t.name} className="bg-canvas-pure border border-ice-border rounded-xl p-6 text-left flex flex-col gap-4 hover:shadow-premium transition-shadow duration-200">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <span key={i} className="text-amber-400 text-sm">★</span>
                        ))}
                      </div>
                      <p className="text-sm text-ink-slate font-light leading-relaxed flex-1">"{t.quote}"</p>
                      <div className="flex items-center gap-3 pt-2 border-t border-ice-border/40">
                        <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                          {t.avatar}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-ink-navy block">{t.name}</span>
                          <span className="text-[11px] text-ink-muted font-mono">{t.city} · {t.device}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Pricing Transparency ──────────────────────────────────── */}
              <div className="py-8 border-t border-ice-border/40">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div className="text-left">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt mb-4 tracking-wide uppercase">Our Pricing Engine</span>
                    <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight mb-4">How We Calculate Your Price</h2>
                    <p className="text-ink-slate text-sm font-light leading-relaxed mb-6">
                      We use a transparent, algorithmically-computed pricing model. No guesswork, no negotiation theatre. Every deduction is based on publicly documented rules.
                    </p>
                    <div className="space-y-4">
                      {[
                        { label: 'Base Price (Flawless)', desc: 'Market-calibrated anchor for your model + storage variant', color: 'bg-cobalt text-white' },
                        { label: '− Condition Deductions', desc: 'Fixed or % deductions per reported defect (screen, body, camera, battery)', color: 'bg-red-100 text-red-700' },
                        { label: '− Accessory Deductions', desc: 'Missing box, charger, or accessories deducted at fixed rates', color: 'bg-orange-100 text-orange-700' },
                        { label: '= Final Payout', desc: 'Protected by category caps so you always get ≥8% of base value', color: 'bg-emerald-100 text-emerald-700' },
                      ].map((step, i) => (
                        <div key={step.label} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${step.color}`}>
                            {i + 1}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-ink-navy">{step.label}</span>
                            <p className="text-xs text-ink-muted font-light">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider font-bold">Live Example — iPhone 14 Pro Max 256GB</div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">87% Retained</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Base Price (256GB, Flawless)', value: '₹46,010', color: 'text-cobalt' },
                        { label: '− Minor Screen Scratch (10%)', value: '− ₹4,601', color: 'text-red-500' },
                        { label: '− Missing Original Charger / Cable', value: '− ₹1,500', color: 'text-orange-500' },
                        { label: '= Your Final Payout', value: '₹39,909', color: 'text-emerald-600', bold: true },
                      ].map(row => (
                        <div key={row.label} className={`flex justify-between items-center py-2.5 ${row.bold ? 'border-t-2 border-ink-navy/10 pt-4 mt-2' : 'border-b border-ice-border/40'}`}>
                          <span className={`text-sm ${row.bold ? 'font-bold text-ink-navy' : 'font-light text-ink-slate'}`}>{row.label}</span>
                          <span className={`text-sm font-bold font-mono ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 p-3 bg-cobalt/5 border border-cobalt/20 rounded-lg text-xs text-ink-muted font-light leading-relaxed">
                      💡 Category caps prevent any single defect category from deducting more than 40% (screen), 20% (body), 18% (camera), or 8% (battery).
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. FAQ Section ───────────────────────────────────────────── */}
              <FaqSection />

              {/* 8. CTA Block ─────────────────────────────────────────────── */}
              <div className="py-8 border-t border-ice-border/40">
                <div className="bg-gradient-to-br from-cobalt to-blue-700 rounded-2xl p-10 text-white text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
                  <div className="relative z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/90 mb-4 tracking-wide uppercase border border-white/10">Ready to sell?</span>
                    <h2 className="text-3xl sm:text-4xl font-black mb-4 max-w-xl mx-auto leading-tight">Get Your Instant Quote in Under 60 Seconds</h2>
                    <p className="text-blue-100 font-light mb-8 max-w-md mx-auto text-sm leading-relaxed">
                      No sign-up required. Just select your device, answer a few questions, and we'll show you your best price — instantly.
                    </p>
                    <button
                      onClick={() => { handleReset(); navigate('/smartphones'); }}
                      className="bg-white text-cobalt hover:bg-blue-50 px-8 py-4 rounded-xl font-black text-sm shadow-xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Start Free Valuation →
                    </button>
                    <p className="text-blue-200/60 text-[11px] mt-4 font-mono">No commitment. Quote valid for 7 days.</p>
                  </div>
                </div>
              </div>

              {/* 9. Featured Deals Bento Grid — Bespoke Device Stage */}
              <div className="space-y-8 py-4">
                <div className="text-center max-w-3xl mx-auto">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 shadow-sm tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-cobalt" /> TOP VALUATION DEALS
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight mt-3">
                    Featured High-Value Trade-Ins
                  </h2>
                  <p className="text-ink-slate mt-2 text-sm sm:text-base font-light">
                    Get top market value for popular premium devices today with guaranteed doorstep payout.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Large Hero Card: iPhone 15 Pro Max */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-[#001736] via-[#00224d] to-[#00122e] border border-blue-500/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl group text-left">
                    <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Left Details Column */}
                    <div className="z-10 flex-1 flex flex-col justify-between h-full">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-400/30">
                          <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400/30" /> Top Offer Today
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight leading-tight">
                          iPhone 15 Pro Max
                        </h3>
                        <p className="text-slate-300 mt-2 text-sm font-light leading-relaxed max-w-sm">
                          Lock in maximum resale value before the next generation release. Free doorstep pickup &amp; instant payout.
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] text-blue-300/80 uppercase tracking-widest font-mono">Valuation Up To</p>
                          <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1 font-outfit">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                              (() => {
                                const found = MODELS.find(m => m.id === 'apple-15pm');
                                return found ? getMaxVariantPrice(found) : 57000;
                              })()
                            )}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDirectSelectModel('apple-15pm')}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                        >
                          <span>Get Valuation</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Right Device Showcase Stage */}
                    <div className="z-10 relative flex-shrink-0 w-full md:w-56 lg:w-64">
                      <div className="bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] rounded-2xl p-4 border border-white/20 shadow-2xl flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/10 text-slate-700">
                          256GB / Titanium
                        </div>
                        <img
                          src={applePhoneImg}
                          alt="iPhone 15 Pro Max"
                          width={256}
                          height={512}
                          decoding="async"
                          className="w-44 sm:w-48 h-auto object-contain mix-blend-multiply drop-shadow-lg py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right stack (Samsung + OnePlus) */}
                  <div className="flex flex-col gap-6 justify-between">
                    {/* Samsung Galaxy S24 Ultra */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 relative overflow-hidden group text-left">
                      <div className="z-10 flex-1 pr-4">
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Galaxy AI</span>
                        <h4 className="text-lg font-bold text-ink-navy mt-1.5">Galaxy S24 Ultra</h4>
                        <p className="text-xs text-ink-slate mt-0.5 font-medium">Valuations up to <span className="text-emerald-600 font-extrabold text-sm">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((() => {
                          const found = MODELS.find(m => m.id === 'sam-s24u');
                          return found ? getMaxVariantPrice(found) : 42000;
                        })())}</span></p>
                        <button 
                          onClick={() => handleDirectSelectModel('sam-s24u')}
                          className="text-xs font-bold text-cobalt hover:text-blue-700 flex items-center gap-1 mt-3 transition-colors"
                        >
                          <span>Get Valuation</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-20 sm:w-24 h-24 bg-slate-100 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-inner">
                        <img
                          src={samsungPhoneImg}
                          alt="Galaxy S24 Ultra"
                          width={96}
                          height={192}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* OnePlus 12 */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-red-400/50 transition-all duration-300 relative overflow-hidden group text-left">
                      <div className="z-10 flex-1 pr-4">
                        <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">Fast Charge</span>
                        <h4 className="text-lg font-bold text-ink-navy mt-1.5">OnePlus 12</h4>
                        <p className="text-xs text-ink-slate mt-0.5 font-medium">Valuations up to <span className="text-emerald-600 font-extrabold text-sm">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((() => {
                          const found = MODELS.find(m => m.id === 'op-12');
                          return found ? getMaxVariantPrice(found) : 24000;
                        })())}</span></p>
                        <button 
                          onClick={() => handleDirectSelectModel('op-12')}
                          className="text-xs font-bold text-cobalt hover:text-blue-700 flex items-center gap-1 mt-3 transition-colors"
                        >
                          <span>Get Valuation</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-20 sm:w-24 h-24 bg-slate-100 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-inner">
                        <img
                          src={oneplusPhoneImg}
                          alt="OnePlus 12"
                          width={96}
                          height={192}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bulk Liquidation Corporate Banner */}
                  <div className="lg:col-span-3 bg-gradient-to-r from-[#001c3d] via-[#002856] to-[#00142e] border border-blue-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl text-left">
                    <div className="z-10 max-w-2xl">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-400/30 inline-flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" /> CORPORATE &amp; ENTERPRISE SERVICES
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">Enterprise Device Liquidation</h3>
                      <p className="text-slate-300 mt-2 text-sm font-light leading-relaxed">
                        Selling company laptops or smartphone fleets? Get customized bulk pricing, NIST-compliant hardware data wiping, and direct corporate logistics.
                      </p>
                    </div>
                    <button
                      onClick={() => { handleReset(); navigate('/contact'); }}
                      className="mt-4 md:mt-0 bg-white hover:bg-slate-100 text-cobalt px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap z-10 flex-shrink-0 flex items-center gap-2"
                    >
                      <span>Contact B2B Team</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isWorkflow && activeStage === 'diagnose' && selectedModel && selectedVariant && (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]" aria-label="Loading diagnostic wizard" role="status">
                <div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            }>
              <DiagnosticWizard
                model={selectedModel}
                variant={selectedVariant}
                onBack={() => setActiveStage('select')}
                onComplete={handleDiagnosticsComplete}
                selectedDefects={selectedDefects}
                setSelectedDefects={setSelectedDefects}
                step={wizardStep}
                setStep={setWizardStep}
                currentUser={currentUser}
                onLoginSuccess={(user: ApiUser) => setCurrentUser(user)}
                onNavigate={navigate}
              />
            </Suspense>
          )}

          {isWorkflow && activeStage === 'schedule' && selectedModel && selectedVariant && (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]" aria-label="Loading pickup scheduler" role="status">
                <div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            }>
              <PickupScheduler
                finalPrice={finalPrice}
                onBack={() => setActiveStage('diagnose')}
                onSuccess={() => { handleReset(); navigate('/'); }}
                selectedDefects={selectedDefects}
                selectedModel={selectedModel}
                selectedVariant={selectedVariant}
                onEditDevice={() => setActiveStage('select')}
                currentUser={currentUser}
                onNavigate={navigate}
              />
            </Suspense>
          )}

          {path === SECRET_ADMIN_PATH && (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]" aria-label="Loading admin panel" role="status">
                <div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            }>
              <AdminPinGate onExit={() => { handleReset(); navigate('/'); }}>
                <AdminPanel
                  onBack={() => { handleReset(); navigate('/'); }}
                  initialBookings={apiBookings}
                  brands={BRANDS}
                  onRefreshBookings={refreshBookings}
                  onRefreshCatalog={refreshCatalog}
                />
              </AdminPinGate>
            </Suspense>
          )}

          {/* ── In-Page Pilot Mode Feedback Section ── */}
          {PILOT_MODE_ENABLED && !isWorkflow && path === '/' && (
            <PilotFeedbackSection currentUser={currentUser} onNavigate={navigate} />
          )}
        </section>
      </main>


      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-canvas-pure border-t border-ice-border mt-8 sm:mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-ice-border/40">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { handleReset(); navigate('/'); }}>
              <img src="/logo.svg" className="w-8 h-8 object-contain rounded-md" alt="Rephonix Logo" />
              <span className="text-xl font-extrabold text-ink-navy tracking-tight">Re<span className="text-secondary">phonix</span></span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-xs font-semibold text-ink-slate">
              <span onClick={() => { handleReset(); navigate('/'); }} className="hover:text-cobalt cursor-pointer transition-colors">Home</span>
              <span onClick={() => { handleReset(); navigate('/smartphones'); }} className="hover:text-cobalt cursor-pointer transition-colors">Smartphones</span>
              <span onClick={() => { handleReset(); navigate('/tablets'); }} className="hover:text-cobalt cursor-pointer transition-colors">Tablets/iPads</span>
              <span onClick={() => { handleReset(); navigate('/about'); }} className="hover:text-cobalt cursor-pointer transition-colors">About</span>
              <span onClick={() => { handleReset(); navigate('/contact'); }} className="hover:text-cobalt cursor-pointer transition-colors">Contact</span>
              <span onClick={() => setIsSpecModalOpen(true)} className="hover:text-cobalt cursor-pointer transition-colors">System Spec</span>
              <a 
                href="https://www.instagram.com/rephonix.in/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-pink-600 cursor-pointer transition-colors flex items-center gap-1.5 text-pink-600 font-bold bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20"
                aria-label="Rephonix Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-ink-muted gap-4">
            <p>&copy; {new Date().getFullYear()} Rephonix. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <a 
                href="https://www.instagram.com/rephonix.in/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-ink-slate hover:text-pink-600 transition-colors font-medium"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>@rephonix.in</span>
              </a>
              <span>•</span>
              <p>Built with ❤️ for secure, sustainable device resale.</p>
            </div>
          </div>

          {/* Legal & Trademark Disclaimer */}
          <div className="mt-6 pt-4 border-t border-ice-border/30 text-[10px] text-zinc-400 font-light leading-relaxed text-center sm:text-left">
            <h4 className="font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider font-mono text-[9px]">TRADEMARK &amp; BRAND RIGHTS DISCLAIMER</h4>
            <p className="mb-1">
              Rephonix is an independent marketplace for buying and selling pre-owned electronic devices. All third-party brand names, trademarks, logos, and product names mentioned on this platform belong to their respective owners. Rephonix is not affiliated with, endorsed by, sponsored by, or authorized by any such brand or manufacturer.
            </p>
            <p>
              Brand references are used solely for product identification and do not imply any affiliation or endorsement.
            </p>
          </div>
        </div>
      </footer>

      {/* Specs Modal */}
      <SpecsModal isOpen={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} />
      {PILOT_MODE_ENABLED && (
        <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} currentUser={currentUser} onNavigate={navigate} />
      )}
      <Suspense fallback={null}>
        <OrderTrackingModal isOpen={isTrackOpen} onClose={() => setIsTrackOpen(false)} currentUser={currentUser} models={MODELS} initialTab={trackModalTab} />
      </Suspense>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
