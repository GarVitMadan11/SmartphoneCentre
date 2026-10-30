import { useState, useEffect, useRef, useMemo, Suspense, useCallback, startTransition } from 'react';
// Types only — no heavy data arrays in this import (keeps initial bundle lean)
import type { Model, Variant, DefectRule, Brand } from './data/mockDatabase';
// Helper functions needed at startup — imported statically but lightweight
import { generateVariantsForModel, getDefectRulesForCategory, getMaxVariantPrice, isTabletDevice } from './data/mockDatabase';
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
import { FeaturedDevicesBento } from './components/client/FeaturedDevicesBento';
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
  ShieldCheck, Search, Instagram
} from 'lucide-react';



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

  const handleDirectSelectModel = useCallback((modelIdOrQuery: string) => {
    const q = (modelIdOrQuery || '').toLowerCase().trim();
    let model = MODELS.find((m: Model) => !m.hidden && (m.id === modelIdOrQuery || m.legacyId === modelIdOrQuery));
    if (!model) {
      model = MODELS.find((m: Model) => !m.hidden && (m.id.toLowerCase() === q || (m.legacyId && m.legacyId.toLowerCase() === q)));
    }
    if (!model) {
      model = MODELS.find((m: Model) => !m.hidden && (m.name.toLowerCase() === q || m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())));
    }
    if (!model) {
      console.warn('[App] Model not found for direct selection:', modelIdOrQuery);
      return;
    }
    if (isTabletDevice(model.brandId, model.name, model.id)) {
      handleReset();
      setPendingModelId(model.id);
      navigate('/tablets?model=' + model.id);
      return;
    }
    const variants = generateVariantsForModel(model);
    if (variants?.length) {
      const chosen = variants[0];
      handleReset();
      handleVariantSelected(model, chosen);
      const targetPath = getPathForModel(model, chosen.storageGb, chosen.ramGb);
      navigate(targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [MODELS, handleReset, navigate, setPendingModelId, handleVariantSelected, getPathForModel]);

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

  // ── Dedicated Full-Screen Immersive Workspace for Admin Operations ───────────
  if (path === SECRET_ADMIN_PATH) {
    return (
      <div className="w-full h-screen bg-slate-950 text-ink-navy flex flex-col font-sans overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white" role="status"><div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin" /></div>}>
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
      </div>
    );
  }

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

          {cleanPath === '/about' && <AboutPage onNavigate={navigate} />}
          {cleanPath === '/contact' && <ContactPage onShowToast={showToast} />}

          {/* Redirect /tablets to /smartphones while tablet catalogue is being refined */}
          {cleanPath === '/tablets' && (
            <div className="py-12 text-center">
              {(() => {
                navigate('/smartphones');
                return null;
              })()}
            </div>
          )}

          {false && cleanPath === '/tablets' && !isWorkflow && (
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
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/25 shadow-xs mb-6 font-outfit transition-all duration-300 hover:bg-secondary/15 select-none">
                    <ShieldCheck className="w-4 h-4 text-secondary stroke-[2.2] flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-secondary">
                      A Trusted Resale Partner
                    </span>
                    <span className="relative flex h-1.5 w-1.5 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
                    </span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink-navy tracking-tight leading-none mb-6">
                    Sell Your Smartphone <br className="hidden sm:inline" />for the <span className="text-secondary">Best Price</span>
                  </h1>
                  <p className="text-base sm:text-lg text-ink-slate mb-8 max-w-xl font-light leading-relaxed">
                    Get an instant valuation and immediate online or UPI payment. No hidden deductions, guaranteed.
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
                      <span className="font-outfit text-ink-navy">Zero Hidden Deductions</span>
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
                models={MODELS}
                onSelectModel={(modelId) => {
                  handleReset();
                  handleDirectSelectModel(modelId);
                }}
                onSelectCategory={(cat) => {
                  handleReset();
                  navigate(cat === 'tablets' ? '/tablets' : '/smartphones');
                }}
              />

              {/* Sell Your Device Section with Most Valued Devices Bento above the Process segment */}
              <SellYourDevice
                currentUser={currentUser}
                onGetValuation={() => { handleReset(); navigate('/smartphones'); }}
              >
                {/* Featured Device Showcase (3-column bento with sliding phones) */}
                <FeaturedDevicesBento
                  onSelectModel={handleDirectSelectModel}
                  onNavigate={(dest: string) => { handleReset(); navigate(dest); }}
                />
              </SellYourDevice>

              {/* FAQ Section */}
              <FaqSection />
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
              {[['/', 'Home'], ['/smartphones', 'Smartphones'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => (
                <span key={href} onClick={() => { handleReset(); navigate(href); }} className="hover:text-cobalt cursor-pointer transition-colors">{label}</span>
              ))}
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
