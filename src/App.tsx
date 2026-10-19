import { useState, useEffect, useRef, useMemo, Suspense, useCallback, startTransition } from 'react';
// Types only — no heavy data arrays in this import (keeps initial bundle lean)
import type { Model, Variant, DefectRule, Brand } from './data/mockDatabase';
// Helper functions needed at startup — imported statically but lightweight
import { generateVariantsForModel, getDeviceImage, getDefectRulesForCategory, getMaxVariantPrice, isTabletDevice } from './data/mockDatabase';
import { calculateValuation } from './utils/valuation';
import type { SavedQuote } from './utils/savedQuotes';
import { fetchCurrentUser, syncFirebaseUser, type ApiUser } from './utils/api';
import { subscribeToFirebaseAuth, checkRedirectAuthResult } from './services/firebaseAuth';
import { getModelUrlPath, matchModelFromPath, formatVariantSlug } from './utils/slugs';
import { getCachedModels } from './utils/api';

// ── Stores ───────────────────────────────────────────────────────────────────
import { useAuthStore } from './store/useAuthStore';
import { useCatalogStore } from './store/useCatalogStore';
import { useWizardStore } from './store/useWizardStore';
import { useNavStore } from './store/useNavStore';

// ── Components ────────────────────────────────────────────────────────────────
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
import { SpecsModal } from './components/client/SpecsModal';
import { FaqSection } from './components/client/FaqSection';
import { safeLazy } from './utils/safeLazy';
import { SECRET_ADMIN_PATH, DECOY_ADMIN_PATHS } from './constants/routes';

// ── Lazy-loaded heavy components (code splitting with chunk auto-retry) ───────
const DiagnosticWizard   = safeLazy(() => import('./components/client/DiagnosticWizard'), 'DiagnosticWizard');
const PickupScheduler    = safeLazy(() => import('./components/client/PickupScheduler'), 'PickupScheduler');
const AdminPanel         = safeLazy(() => import('./components/admin/AdminPanel'), 'AdminPanel');
const AdminPinGate       = safeLazy(() => import('./components/admin/AdminPinGate'), 'AdminPinGate');
const SmartphoneMockup   = safeLazy(() => import('./components/client/SmartphoneMockup'), 'SmartphoneMockup');
const OrderTrackingModal = safeLazy(() => import('./components/client/OrderTrackingModal'), 'OrderTrackingModal');

import {
  Award, ShieldCheck, Zap, Search,
  Truck, Lock, CheckCircle2, Sparkles, ArrowRight, Instagram
} from 'lucide-react';

import applePhoneImg from './assets/apple_phone.png';
import samsungPhoneImg from './assets/samsung_phone.png';
import oneplusPhoneImg from './assets/oneplus_phone.png';

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Store selectors ─────────────────────────────────────────────────────────
  const { currentUser, setCurrentUser, logout } = useAuthStore();

  const {
    brands: BRANDS, models: MODELS, orderedBrands, apiBookings,
    setBrands, setModels, setApiBookings,
    refreshCatalog, refreshBookings, bumpOrderVersion,
  } = useCatalogStore();

  const {
    activeStage, wizardStep, selectedModel, selectedVariant,
    selectedDefects, finalPrice, selectedTabletBrand,
    setActiveStage, setWizardStep, setSelectedModel, setSelectedVariant,
    setSelectedDefects, setFinalPrice, setSelectedTabletBrand,
    handleVariantSelected, handleDiagnosticsComplete, reset: handleReset,
  } = useWizardStore();

  const {
    path, navigate, pendingModelId, pendingBrandId, pendingVariant,
    setPendingModelId, setPendingBrandId, setPendingVariant,
  } = useNavStore();

  // ── Local UI state (does not belong in global stores) ──────────────────────
  const [toasts, setToasts]                     = useState<ToastMessage[]>([]);
  const [isSpecModalOpen, setIsSpecModalOpen]   = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen]           = useState(false);
  const [trackModalTab, setTrackModalTab]       = useState<'my_bookings' | 'track_search' | 'invoices'>('my_bookings');
  const [heroSearch, setHeroSearch]             = useState('');
  const [heroSearchOpen, setHeroSearchOpen]     = useState(false);
  const heroSearchRef                           = useRef<HTMLDivElement>(null);
  const isResumingQuoteRef                      = useRef(false);
  const catalogReadyRef                         = useRef(false);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', title = 'Notice') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Browser navigation sync ──────────────────────────────────────────────────
  useEffect(() => {
    const handlePopState = () => useNavStore.getState().navigate(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Admin hotkey (Ctrl/Cmd + Shift + A) ─────────────────────────────────────
  useEffect(() => {
    const handleAdminHotkey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate(SECRET_ADMIN_PATH);
      }
    };
    window.addEventListener('keydown', handleAdminHotkey);
    return () => window.removeEventListener('keydown', handleAdminHotkey);
  }, [navigate]);

  // ── Decoy admin path trap ────────────────────────────────────────────────────
  useEffect(() => {
    const cleanP = path.split('?')[0].toLowerCase();
    if (DECOY_ADMIN_PATHS.includes(cleanP)) {
      console.warn(`[Security Alert] Decoy admin path probe blocked: ${path}`);
      navigate('/');
    }
  }, [path, navigate]);

  // ── Sync activeStage with secret admin path ──────────────────────────────────
  useEffect(() => {
    startTransition(() => {
      if (path === SECRET_ADMIN_PATH) {
        setActiveStage('admin');
      } else if (activeStage === 'admin') {
        setActiveStage('select');
      }
    });
  }, [path, activeStage, setActiveStage]);

  // ── Auth: fetch current session + Firebase listener ──────────────────────────
  useEffect(() => {
    fetchCurrentUser()
      .then((res) => { if (res?.user) setCurrentUser(res.user); })
      .catch(() => { /* Guest visitor */ });

    checkRedirectAuthResult().catch(() => {});

    const unsubscribe = subscribeToFirebaseAuth(async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const synced = await syncFirebaseUser(token);
          if (synced?.user) { setCurrentUser(synced.user); return; }
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
  }, [setCurrentUser]);

  // ── Redirect logged-in user away from auth pages ─────────────────────────────
  useEffect(() => {
    if (currentUser && (path.startsWith('/login') || path.startsWith('/signup'))) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      navigate(redirect === 'booking' ? '/smartphones' : '/');
    }
  }, [currentUser, path, navigate]);

  // ── Restore pending booking flow on login ────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const pendingData = localStorage.getItem('pending_booking_flow');
    if (!pendingData) return;
    try {
      const parsed = JSON.parse(pendingData);
      if (parsed.selectedModel)  setSelectedModel(parsed.selectedModel);
      if (parsed.selectedVariant) setSelectedVariant(parsed.selectedVariant);
      if (parsed.selectedDefects) setSelectedDefects(parsed.selectedDefects);
      if (parsed.finalPrice)     setFinalPrice(parsed.finalPrice);
      if (parsed.wizardStep)     setWizardStep(parsed.wizardStep);
      if (parsed.activeStage)    setActiveStage(parsed.activeStage);
      localStorage.removeItem('pending_booking_flow');
      showToast('Resumed your device selling workflow.', 'info');
    } catch (err) {
      console.error('Failed to restore pending booking flow:', err);
    }
  }, [currentUser, setSelectedModel, setSelectedVariant, setSelectedDefects, setFinalPrice, setWizardStep, setActiveStage, showToast]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully.', 'info');
      navigate('/');
    } catch (err: any) {
      showToast('Logout failed: ' + (err.message || err), 'error');
    }
  };

  // ── Catalog: lazy-load static data + catalog order change listener ────────────
  useEffect(() => {
    let cancelled = false;
    import('./data/mockDatabase').then((db) => {
      if (cancelled) return;
      const { brands: storeBrands, models: storeModels, apiBookings: storeBookings } = useCatalogStore.getState();
      if (storeBrands.length === 0) setBrands(db.BRANDS);
      if (storeModels.length === 0) {
        const cached = getCachedModels();
        setModels((cached.length > 0 ? cached : db.MODELS) as Model[]);
      }
      if (storeBookings.length === 0) setApiBookings(db.INITIAL_BOOKINGS);
      catalogReadyRef.current = true;
    }).catch(() => {
      console.warn('[App] Failed to load catalog data module');
      catalogReadyRef.current = true;
    });

    refreshCatalog();
    refreshBookings();
    return () => { cancelled = true; };
  }, [setBrands, setModels, setApiBookings, refreshCatalog, refreshBookings]);

  useEffect(() => {
    const handleOrderChange = () => {
      bumpOrderVersion();
      refreshCatalog();
    };
    window.addEventListener('stc_catalog_order_changed', handleOrderChange);
    return () => window.removeEventListener('stc_catalog_order_changed', handleOrderChange);
  }, [bumpOrderVersion, refreshCatalog]);

  // ── Restore model from saved nav once catalog is loaded ─────────────────────
  const savedModelRestored = useRef(false);
  useEffect(() => {
    if (savedModelRestored.current || MODELS.length === 0) return;
    const raw = localStorage.getItem('stc_nav');
    if (!raw) return;
    try {
      const nav = JSON.parse(raw);
      if (!nav?.selectedModelId) return;
      const apiModel = MODELS.find((m: Model) => m.id === nav.selectedModelId && !m.hidden);
      if (apiModel) {
        setSelectedModel(apiModel);
        if (nav.selectedVariant) {
          setSelectedVariant(nav.selectedVariant);
        } else {
          const variants = generateVariantsForModel(apiModel);
          setSelectedVariant(variants[0] || null);
        }
        if (nav.selectedDefectIds?.length > 0) {
          const rules = getDefectRulesForCategory(apiModel.category, apiModel.brandId, apiModel.name, apiModel.id);
          setSelectedDefects(rules.filter((r: DefectRule) => nav.selectedDefectIds.includes(r.id)));
        }
      } else if (MODELS.some((m: Model) => m.id === nav.selectedModelId && m.hidden)) {
        setSelectedModel(null);
        setSelectedVariant(null);
        setActiveStage('select');
      }
    } catch { /* ignore */ }
    savedModelRestored.current = true;
  }, [MODELS, setSelectedModel, setSelectedVariant, setSelectedDefects, setActiveStage]);

  // ── Deep-link URL route matcher ──────────────────────────────────────────────
  useEffect(() => {
    if (isResumingQuoteRef.current) { isResumingQuoteRef.current = false; return; }
    if (MODELS.length === 0) return;
    const clean = path.split('?')[0];
    const match = matchModelFromPath(clean, MODELS, BRANDS);
    if (!match) return;

    const model = match.model;
    if (isTabletDevice(model.brandId, model.name, model.id) && (!match.variant || !match.variant.storageGb)) {
      setPendingModelId(model.id);
      navigate('/tablets?model=' + model.id);
      return;
    }

    const variants = generateVariantsForModel(model);
    if (!variants?.length) return;

    let chosenVariant = variants[0];
    if (match.variant?.storageGb) {
      const { storageGb: targetStorage, ramGb: targetRam } = match.variant;
      const found = variants.find((v: Variant) => {
        return v.storageGb === targetStorage && (targetRam ? v.ramGb === targetRam : true);
      }) || variants.find((v: Variant) => v.storageGb === targetStorage);
      if (found) chosenVariant = found;
    }

    setSelectedModel(model);
    setSelectedVariant(chosenVariant);
    setFinalPrice(chosenVariant.basePrice);
    setSelectedDefects([]);
    setWizardStep(0);
    setActiveStage('diagnose');
  }, [path, MODELS, BRANDS, navigate, setPendingModelId, setSelectedModel, setSelectedVariant, setFinalPrice, setSelectedDefects, setWizardStep, setActiveStage]);

  // ── Document title ────────────────────────────────────────────────────────────
  useEffect(() => {
    let title = 'Rephonix | Sell Your Devices at the Best Price';
    const cleanPath = path.split('?')[0];
    const modelMatch = matchModelFromPath(cleanPath, MODELS, BRANDS);
    if (modelMatch) {
      if (modelMatch.variant?.storageGb) {
        const specStr = formatVariantSlug(modelMatch.variant.storageGb, modelMatch.variant.ramGb).toUpperCase();
        title = `Sell ${modelMatch.model.name} (${specStr}) | Rephonix`;
      } else {
        title = `Sell ${modelMatch.model.name} | Rephonix`;
      }
    } else {
      const titles: Record<string, string> = {
        '/smartphones': 'Sell Smartphones | Rephonix',
        '/tablets': 'Sell Tablets & iPads | Rephonix',
        '/about': 'About Rephonix',
        '/contact': 'Contact Rephonix',
        [SECRET_ADMIN_PATH]: 'Control Center | Rephonix',
        '/login': 'Login | Rephonix',
        '/signup': 'Create Account | Rephonix',
        '/forgot-password': 'Forgot Password | Rephonix',
        '/reset-password': 'Reset Password | Rephonix',
        '/verify-email': 'Verify Email | Rephonix',
        '/profile': 'My Profile | Rephonix',
      };
      title = titles[cleanPath] ?? title;
    }
    document.title = title;
  }, [path, MODELS, BRANDS]);

  // ── Hero search ───────────────────────────────────────────────────────────────
  const heroSearchResults = useMemo(() => {
    if (heroSearch.trim().length < 2) return [];
    const q = heroSearch.toLowerCase().trim();
    const qCompact = q.replace(/\s+/g, '');
    return MODELS.filter((m: Model) => {
      if (m.hidden) return false;
      const brand = BRANDS.find((b: Brand) => b.id === m.brandId);
      const brandName = brand ? brand.name.toLowerCase() : '';
      const modelName = m.name.toLowerCase();
      const seriesName = m.series ? m.series.toLowerCase() : '';
      const fullText = `${brandName} ${modelName} ${seriesName}`;
      const modelNameCompact = modelName.replace(/\s+/g, '');
      const fullTextCompact  = fullText.replace(/\s+/g, '');
      let brandAliases = [brandName];
      if (brandName === 'apple')   brandAliases.push('iphone', 'ios');
      if (brandName === 'samsung') brandAliases.push('galaxy');
      if (brandName === 'google')  brandAliases.push('pixel');
      if (brandName === 'oneplus') brandAliases.push('1plus', 'nord');
      if (brandName === 'xiaomi')  brandAliases.push('mi', 'redmi', 'poco');
      if (brandName === 'vivo')    brandAliases.push('iqoo');
      return (
        fullText.includes(q) || modelName.includes(q) || seriesName.includes(q) ||
        brandAliases.some((a) => a.includes(q)) ||
        (qCompact.length >= 2 && (fullTextCompact.includes(qCompact) || modelNameCompact.includes(qCompact)))
      );
    }).slice(0, 10);
  }, [heroSearch, MODELS, BRANDS]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setHeroSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────────
  const getPathForModel = useCallback((model: Model, storageGb?: number, ramGb?: number): string => {
    const brand = BRANDS.find((b: Brand) => b.id === model.brandId);
    return getModelUrlPath(brand?.name || model.brandId, model.name, storageGb, ramGb);
  }, [BRANDS]);

  const handleDirectSelectModel = useCallback((modelId: string) => {
    const model = MODELS.find((m: Model) => m.id === modelId && !m.hidden);
    if (!model) return;
    if (isTabletDevice(model.brandId, model.name, model.id)) {
      handleReset();
      setPendingModelId(model.id);
      navigate('/tablets?model=' + model.id);
      return;
    }
    const variants = generateVariantsForModel(model);
    if (variants?.length) handleVariantSelected(model, variants[0]);
  }, [MODELS, handleReset, navigate, setPendingModelId, handleVariantSelected]);

  const handleHeroSearchSelect = (model: Model) => {
    setHeroSearch('');
    setHeroSearchOpen(false);
    if (isTabletDevice(model.brandId, model.name, model.id)) {
      handleReset();
      setPendingModelId(model.id);
      navigate('/tablets?model=' + model.id);
      return;
    }
    setPendingModelId(model.id);
    const targetPath = getPathForModel(model);
    handleReset();
    navigate(targetPath);
  };

  const handleResumeQuote = (quote: SavedQuote) => {
    const targetModel = MODELS.find((m: Model) => m.id === quote.modelId || m.name.toLowerCase() === quote.modelName.toLowerCase());
    if (!targetModel) { showToast('The saved model could not be found in the current catalog.', 'error'); return; }
    const variants = generateVariantsForModel(targetModel);
    const matchedVariant = variants.find((v: Variant) => v.id === quote.variantId || v.storageGb === quote.storageGb) || variants[0];
    if (!matchedVariant) { showToast('The requested variant is no longer available.', 'error'); return; }
    const rules = getDefectRulesForCategory(targetModel.category, targetModel.brandId, targetModel.name, targetModel.id);
    const matchedDefects = rules.filter((r: DefectRule) => (quote.selectedDefectIds || []).includes(r.id));
    const valuation = calculateValuation(matchedVariant, matchedDefects, {
      modelId: targetModel.id, brandId: targetModel.brandId,
      modelName: targetModel.name, category: targetModel.category,
    });
    const targetPath = getPathForModel(targetModel, matchedVariant.storageGb, matchedVariant.ramGb);
    isResumingQuoteRef.current = true;
    startTransition(() => {
      setSelectedModel(targetModel);
      setSelectedVariant(matchedVariant);
      setSelectedDefects(matchedDefects);
      setFinalPrice(valuation.finalPrice);
      setWizardStep(7);
      setActiveStage('diagnose');
      setIsTrackOpen(false);
      navigate(targetPath);
    });
  };

  // ── Computed ──────────────────────────────────────────────────────────────────
  const isWorkflow = (activeStage === 'diagnose' || activeStage === 'schedule') &&
    selectedModel !== null && selectedVariant !== null;
  const cleanPath = path.split('?')[0];

  if (import.meta.env.VITE_COMING_SOON === 'true') return <ComingSoon />;

  // ─────────────────────────────────────────────────────────────────────────────
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

          {path.startsWith('/forgot-password') && <ForgotPasswordPage onNavigate={navigate} />}

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
              onResumeQuote={handleResumeQuote}
            />
          )}

          {path.startsWith('/profile') && !currentUser && (
            <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} onNavigate={navigate} />
          )}

          {cleanPath === '/about' && <AboutPage />}
          {cleanPath === '/contact' && <ContactPage onShowToast={showToast} />}

          {cleanPath === '/tablets' && !isWorkflow && (
            <TabletsShowcase
              models={MODELS}
              onSelectVariant={handleVariantSelected}
              defaultModelId={pendingModelId}
              onDefaultModelConsumed={() => setPendingModelId(null)}
              onModelClick={(model) => { window.history.pushState({}, '', getPathForModel(model)); }}
              onModelDismiss={() => { window.history.replaceState({}, '', '/tablets'); }}
              onVariantChange={(model, storageGb, ramGb) => {
                window.history.replaceState({}, '', getPathForModel(model, storageGb, ramGb));
              }}
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
                onModelClick={(model) => { window.history.pushState({}, '', getPathForModel(model)); }}
                onModelDismiss={() => { window.history.replaceState({}, '', '/smartphones'); }}
                onVariantChange={(model, storageGb, ramGb) => {
                  window.history.replaceState({}, '', getPathForModel(model, storageGb, ramGb));
                }}
                defaultBrandId={pendingBrandId}
                onDefaultBrandConsumed={() => setPendingBrandId(null)}
                defaultModelId={pendingModelId}
                defaultVariant={pendingVariant}
                onDefaultModelConsumed={() => { setPendingModelId(null); setPendingVariant(null); }}
                brands={BRANDS}
                models={MODELS}
              />
            </div>
          )}

          {cleanPath === '/' && !isWorkflow && (
            <div className="space-y-20 pt-4 pb-12 sm:pt-6 sm:pb-16">
              {/* 1. Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Hero Call to Action */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary mb-6 tracking-wide uppercase">
                    ★ A Trusted Resale Partner
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink-navy tracking-tight leading-none mb-6">
                    Sell Your Smartphone <br className="hidden sm:inline" />for the <span className="text-secondary">Best Price</span>
                  </h1>
                  <p className="text-base sm:text-lg text-ink-slate mb-8 max-w-xl font-light leading-relaxed">
                    Get an instant valuation, free doorstep pickup, and instant online or UPI payment. No hidden deductions, guaranteed.
                  </p>

                  {/* Brand Logo Quick-Select Pills */}
                  {orderedBrands.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mb-5">
                      {orderedBrands.map((brand: Brand) => (
                        <button
                          key={brand.id}
                          onClick={() => { handleReset(); setPendingModelId(null); setPendingBrandId(brand.id); navigate('/smartphones'); }}
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

                  {/* Functional Hero Search Bar */}
                  <div ref={heroSearchRef} className="w-full max-w-lg relative mb-8">
                    <div className="bg-canvas-pure p-2 rounded-lg border border-ice-border flex items-center gap-2 shadow-sm">
                      <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-ink-muted absolute left-3 top-3.5" />
                        <input
                          id="hero-search"
                          type="text"
                          placeholder="Search model (e.g. iPhone 15 Pro, Galaxy S24)..."
                          value={heroSearch}
                          onChange={(e) => { setHeroSearch(e.target.value); setHeroSearchOpen(true); }}
                          onFocus={() => setHeroSearchOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setHeroSearchOpen(false);
                              handleReset();
                              navigate(heroSearch.trim() ? `/smartphones?q=${encodeURIComponent(heroSearch.trim())}` : '/smartphones');
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
                          handleReset();
                          navigate(heroSearch.trim() ? `/smartphones?q=${encodeURIComponent(heroSearch.trim())}` : '/smartphones');
                        }}
                        className="bg-cobalt hover:bg-cobalt-hover text-white px-5 py-3 rounded-sm text-sm font-semibold transition-all shadow-sm flex-shrink-0"
                      >
                        Find My Device
                      </button>
                    </div>

                    {/* Live search results dropdown */}
                    {heroSearchOpen && heroSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-canvas-pure border border-ice-border rounded-sm shadow-premium z-30 overflow-hidden animate-fadeIn">
                        {heroSearchResults.map((model: Model) => {
                          const brand = BRANDS.find((b: Brand) => b.id === model.brandId);
                          return (
                            <button
                              key={model.id}
                              onClick={() => handleHeroSearchSelect(model)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cobalt-light/30 transition-colors text-left border-b border-ice-border/40 last:border-0 group"
                            >
                              <div className="w-8 h-8 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {brand ? <BrandLogo logo={brand.logo} isActive={false} /> : <span className="text-[10px] font-bold text-cobalt">??</span>}
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
                          Showing {heroSearchResults.length} result{heroSearchResults.length !== 1 ? 's' : ''} — or{' '}
                          <button onClick={() => { setHeroSearchOpen(false); handleReset(); navigate('/smartphones'); }} className="text-cobalt underline">
                            browse all models
                          </button>
                        </div>
                      </div>
                    )}
                    {heroSearchOpen && heroSearch.trim().length >= 2 && heroSearchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-canvas-pure border border-ice-border rounded-sm shadow-premium z-30 px-4 py-4 text-sm text-ink-muted text-center animate-fadeIn">
                        No models found for <span className="font-mono text-cobalt">"{heroSearch}"</span>.
                        <button onClick={() => { setHeroSearchOpen(false); handleReset(); navigate('/smartphones'); }} className="block text-xs text-cobalt mt-1 underline mx-auto">
                          Browse all models instead →
                        </button>
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
                  handleReset();
                  navigate(cat === 'tablets' ? '/tablets' : '/smartphones');
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
                    const modelObj = MODELS.find((m: Model) => m.id === dev.id);
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
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4 relative z-10 transition-transform group-hover:scale-105 duration-300">
                          {imgUrl ? (
                            <img src={imgUrl} alt={dev.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain filter drop-shadow-md" loading="lazy" />
                          ) : (
                            <div className="w-full h-full rounded bg-ice-gray flex items-center justify-center text-ink-muted text-[10px]">{dev.name}</div>
                          )}
                        </div>
                        <div className="space-y-1 relative z-10 w-full text-center">
                          <span className="text-[9px] font-mono font-bold tracking-wider text-ink-muted uppercase block">{dev.brand}</span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-ink-navy group-hover:text-cobalt transition-colors font-outfit truncate w-full">{dev.name}</h4>
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

              {/* Sell Your Device Section */}
              <SellYourDevice
                currentUser={currentUser}
                onGetValuation={() => { handleReset(); navigate('/smartphones'); }}
              />

              {/* How It Works Section */}
              <div id="how-it-works-section" className="py-12 border-t border-b border-ice-border/40">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl sm:text-4xl font-black text-ink-navy tracking-tight font-outfit">How it Works</h2>
                  <p className="text-ink-slate mt-2 text-base font-light">Our transparent process ensures you get the highest value with zero doorstep friction.</p>
                </div>
                <div className="relative">
                  <div className="absolute top-16 left-4 right-4 h-0.5 bg-ice-gray hidden md:block z-0" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {[
                      { step: '1', title: 'Check Price', desc: 'Select your smartphone model and answer a few questions about its condition. Get a quote instantly.' },
                      { step: '2', title: 'Schedule Pickup', desc: 'Choose a convenient date and time slot. Our executive will visit your home or office for verification.' },
                      { step: '3', title: 'Get Paid', desc: 'Once condition is verified at your doorstep, get paid instantly via digital bank transfer or UPI.' },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="flex flex-col items-center text-center group">
                        <div className="w-16 h-16 rounded-2xl bg-cobalt text-white flex items-center justify-center text-xl font-black shadow-lg shadow-cobalt/20 mb-6 group-hover:scale-110 transition-transform duration-300 font-outfit">
                          {step}
                        </div>
                        <h3 className="text-xl font-extrabold text-ink-navy mb-2 font-outfit">{title}</h3>
                        <p className="text-sm text-ink-slate max-w-xs font-light leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Benefits / Why Rephonix Section */}
              <div className="py-12">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Benefit cards — condensed but identical content */}
                  <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-[#001c3d] via-[#002652] to-[#00142e] border border-blue-500/30 p-6 text-white shadow-xl hover:shadow-2xl hover:border-blue-400/60 transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/35 transition-all duration-500 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <Zap className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-blue-300/60 uppercase tracking-wider">01</span>
                      </div>
                      <h3 className="text-lg font-extrabold tracking-tight mb-2">Instant Digital Payout</h3>
                      <p className="text-xs text-blue-100/70 font-light leading-relaxed">Money hits your account or UPI ID within minutes of device verification. No waiting, no cheques.</p>
                    </div>
                  </div>

                  <div className="relative group overflow-hidden rounded-2xl bg-canvas-pure border border-ice-border p-6 shadow-md hover:shadow-premium hover:border-cobalt/30 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-cobalt/10 border border-cobalt/15 flex items-center justify-center text-cobalt shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-ink-muted uppercase tracking-wider">02</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-ink-navy tracking-tight mb-2">Transparent Grading</h3>
                      <p className="text-xs text-ink-slate font-light leading-relaxed">Our diagnostic wizard uses a formula-based engine. Every deduction is shown, explained, and locked in before pickup.</p>
                    </div>
                  </div>

                  <div className="relative group overflow-hidden rounded-2xl bg-canvas-pure border border-ice-border p-6 shadow-md hover:shadow-premium hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <Truck className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-ink-muted uppercase tracking-wider">03</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-ink-navy tracking-tight mb-2">Free Doorstep Service</h3>
                      <p className="text-xs text-ink-slate font-light leading-relaxed">Our agent comes to you. No dropping off, no courier risk. Schedule any slot that works for you.</p>
                    </div>
                  </div>

                  <div className="relative group overflow-hidden rounded-2xl bg-canvas-pure border border-ice-border p-6 shadow-md hover:shadow-premium hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center text-purple-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <Lock className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-ink-muted uppercase tracking-wider">04</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-ink-navy tracking-tight mb-2">Verified &amp; Secure</h3>
                      <p className="text-xs text-ink-slate font-light leading-relaxed">DigiLocker-powered KYC. IMEI tracking. Every transaction is cryptographically signed and auditable.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <FaqSection />

              {/* Featured Device Showcase (3-column bento) */}
              <div className="py-4">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary border border-secondary/15 shadow-sm tracking-widest uppercase font-outfit">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Popular Right Now
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight mt-3 font-outfit">
                    Top Trade-In Devices
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* iPhone 15 Pro Max — Hero Card */}
                  <div className="md:col-span-2 bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9] border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group text-left">
                    <div className="absolute inset-0 bg-gradient-to-br from-cobalt/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="z-10 flex-1">
                      <span className="text-[10px] font-mono font-bold text-cobalt bg-cobalt/10 px-2 py-0.5 rounded border border-cobalt/15 uppercase tracking-wider">A17 Pro</span>
                      <h3 className="text-2xl sm:text-3xl font-black text-ink-navy mt-2 tracking-tight">iPhone 15 Pro Max</h3>
                      <p className="text-sm text-ink-slate mt-1 font-medium">
                        Valuations up to{' '}
                        <span className="text-emerald-600 font-extrabold text-lg">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                            (() => { const f = MODELS.find((m: Model) => m.id === 'apple-15pm'); return f ? getMaxVariantPrice(f) : 57000; })()
                          )}
                        </span>
                      </p>
                      <button
                        onClick={() => handleDirectSelectModel('apple-15pm')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 mt-4"
                      >
                        <span>Get Valuation</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="z-10 relative flex-shrink-0 w-full md:w-56 lg:w-64">
                      <div className="bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] rounded-2xl p-4 border border-white/20 shadow-2xl flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/10 text-slate-700">256GB / Titanium</div>
                        <img src={applePhoneImg} alt="iPhone 15 Pro Max" width={256} height={512} decoding="async" className="w-44 sm:w-48 h-auto object-contain mix-blend-multiply drop-shadow-lg py-2" />
                      </div>
                    </div>
                  </div>

                  {/* Right stack (Samsung + OnePlus) */}
                  <div className="flex flex-col gap-6 justify-between">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 relative overflow-hidden group text-left">
                      <div className="z-10 flex-1 pr-4">
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Galaxy AI</span>
                        <h4 className="text-lg font-bold text-ink-navy mt-1.5">Galaxy S24 Ultra</h4>
                        <p className="text-xs text-ink-slate mt-0.5 font-medium">
                          Valuations up to{' '}
                          <span className="text-emerald-600 font-extrabold text-sm">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                              (() => { const f = MODELS.find((m: Model) => m.id === 'sam-s24u'); return f ? getMaxVariantPrice(f) : 42000; })()
                            )}
                          </span>
                        </p>
                        <button onClick={() => handleDirectSelectModel('sam-s24u')} className="text-xs font-bold text-cobalt hover:text-blue-700 flex items-center gap-1 mt-3 transition-colors">
                          <span>Get Valuation</span><ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-20 sm:w-24 h-24 bg-slate-100 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-inner">
                        <img src={samsungPhoneImg} alt="Galaxy S24 Ultra" width={96} height={192} loading="lazy" decoding="async" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-red-400/50 transition-all duration-300 relative overflow-hidden group text-left">
                      <div className="z-10 flex-1 pr-4">
                        <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">Fast Charge</span>
                        <h4 className="text-lg font-bold text-ink-navy mt-1.5">OnePlus 12</h4>
                        <p className="text-xs text-ink-slate mt-0.5 font-medium">
                          Valuations up to{' '}
                          <span className="text-emerald-600 font-extrabold text-sm">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                              (() => { const f = MODELS.find((m: Model) => m.id === 'op-12'); return f ? getMaxVariantPrice(f) : 24000; })()
                            )}
                          </span>
                        </p>
                        <button onClick={() => handleDirectSelectModel('op-12')} className="text-xs font-bold text-cobalt hover:text-blue-700 flex items-center gap-1 mt-3 transition-colors">
                          <span>Get Valuation</span><ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-20 sm:w-24 h-24 bg-slate-100 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-inner">
                        <img src={oneplusPhoneImg} alt="OnePlus 12" width={96} height={192} loading="lazy" decoding="async" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
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

          {/* ── Diagnostic Wizard ── */}
          {isWorkflow && activeStage === 'diagnose' && selectedModel && selectedVariant && (
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]" role="status"><div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" /></div>}>
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

          {/* ── Pickup Scheduler ── */}
          {isWorkflow && activeStage === 'schedule' && selectedModel && selectedVariant && (
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]" role="status"><div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" /></div>}>
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

          {/* ── Admin Panel ── */}
          {path === SECRET_ADMIN_PATH && (
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]" role="status"><div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" /></div>}>
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

          {/* ── Pilot Mode Feedback ── */}
          {PILOT_MODE_ENABLED && !isWorkflow && path === '/' && (
            <PilotFeedbackSection currentUser={currentUser} onNavigate={navigate} />
          )}

        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-canvas-pure border-t border-ice-border mt-8 sm:mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-ice-border/40">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { handleReset(); navigate('/'); }}>
              <img src="/logo.svg" className="w-8 h-8 object-contain rounded-md" alt="Rephonix Logo" />
              <span className="text-xl font-extrabold text-ink-navy tracking-tight">Re<span className="text-secondary">phonix</span></span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-xs font-semibold text-ink-slate">
              {[['/', 'Home'], ['/smartphones', 'Smartphones'], ['/tablets', 'Tablets/iPads'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => (
                <span key={href} onClick={() => { handleReset(); navigate(href); }} className="hover:text-cobalt cursor-pointer transition-colors">{label}</span>
              ))}
              <span onClick={() => setIsSpecModalOpen(true)} className="hover:text-cobalt cursor-pointer transition-colors">System Spec</span>
              <a href="https://www.instagram.com/rephonix.in/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 cursor-pointer transition-colors flex items-center gap-1.5 text-pink-600 font-bold bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
                <Instagram className="w-3.5 h-3.5" /><span>Instagram</span>
              </a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-ink-muted gap-4">
            <p>&copy; {new Date().getFullYear()} Rephonix. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/rephonix.in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-ink-slate hover:text-pink-600 transition-colors font-medium">
                <Instagram className="w-3.5 h-3.5 text-pink-600" /><span>@rephonix.in</span>
              </a>
              <span>•</span>
              <p>Built with ❤️ for secure, sustainable device resale.</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-ice-border/30 text-[10px] text-zinc-400 font-light leading-relaxed text-center sm:text-left">
            <h4 className="font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider font-mono text-[9px]">TRADEMARK &amp; BRAND RIGHTS DISCLAIMER</h4>
            <p className="mb-1">Rephonix is an independent marketplace for buying and selling pre-owned electronic devices. All third-party brand names, trademarks, logos, and product names mentioned on this platform belong to their respective owners. Rephonix is not affiliated with, endorsed by, sponsored by, or authorized by any such brand or manufacturer.</p>
            <p>Brand references are used solely for product identification and do not imply any affiliation or endorsement.</p>
          </div>
        </div>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <SpecsModal isOpen={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} />
      {PILOT_MODE_ENABLED && (
        <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} currentUser={currentUser} onNavigate={navigate} />
      )}
      <Suspense fallback={null}>
        <OrderTrackingModal
          isOpen={isTrackOpen}
          onClose={() => setIsTrackOpen(false)}
          currentUser={currentUser}
          models={MODELS}
          initialTab={trackModalTab}
          onResumeQuote={handleResumeQuote}
        />
      </Suspense>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
