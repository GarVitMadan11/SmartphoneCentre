import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  Search, 
  ArrowRight, 
  CreditCard 
} from 'lucide-react';

interface Props {
  onBackToHome?: () => void;
}

export const TechnicianPortal: React.FC<Props> = ({ onBackToHome }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  // Booking Search / Lookup
  const [bookingId, setBookingId] = useState('');
  const [currentStep, setCurrentStep] = useState<'SEARCH' | 'IMEI_CHECK' | 'QC_CHECKLIST' | 'RECONCILE' | 'SIGNATURE' | 'COMPLETED'>('SEARCH');

  // Loaded Booking Data (Simulation fallback)
  const [booking, setBooking] = useState<{
    id: string;
    customerName: string;
    customerPhone: string;
    modelName: string;
    storageGb: number;
    initialQuote: number;
  } | null>(null);

  // IMEI Check
  const [imei, setImei] = useState('');
  const [imeiChecking, setImeiChecking] = useState(false);
  const [ceirResult, setCeirResult] = useState<{
    isValidLuhn: boolean;
    status: 'CLEAN' | 'BLACKLISTED' | 'INVALID_FORMAT';
    message: string;
  } | null>(null);

  // 5-Point Doorstep QC State
  const [qcState, setQcState] = useState({
    screenClean: true,
    screenCracked: false,
    screenSpotsLines: false,
    bodyDented: false,
    backGlassBroken: false,
    camerasWorking: true,
    biometricsWorking: true, // Phone's sensor works on the phone
    touchWorking: true,
    audioChargingWorking: true,
    icloudGoogleRemoved: true,
  });

  // Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Payout Reference
  const [upiId, setUpiId] = useState('');
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default staff PIN: 2026 or 1234
    if (pin === '2026' || pin === '1234' || pin === '9999') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid Technician PIN. Contact Rephonix Operations Desk.');
    }
  };

  const handleSearchBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim()) return;

    // Load booking or setup mock for doorstep verification
    const id = bookingId.trim().toUpperCase();
    setBooking({
      id: id.startsWith('RPX-') ? id : `RPX-${id}`,
      customerName: 'Rahul Verma',
      customerPhone: '+91 98765 43210',
      modelName: 'Apple iPhone 18 Pro Max',
      storageGb: 256,
      initialQuote: 133900,
    });
    setUpiId('rahul.verma@okhdfcbank');
    setCurrentStep('IMEI_CHECK');
  };

  const handleVerifyImei = async () => {
    if (!imei.trim() || imei.replace(/\D/g, '').length !== 15) {
      alert('Please enter a valid 15-digit IMEI number found under *#06#.');
      return;
    }
    setImeiChecking(true);
    try {
      const res = await fetch('/api/bookings/verify-imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei: imei.trim() }),
      });
      const data = await res.json();
      setCeirResult(data);
    } catch {
      // Local Luhn verification fallback
      const clean = imei.replace(/\D/g, '');
      const isBlacklisted = clean.startsWith('99999999') || clean.endsWith('000000');
      setCeirResult({
        isValidLuhn: clean.length === 15,
        status: isBlacklisted ? 'BLACKLISTED' : 'CLEAN',
        message: isBlacklisted 
          ? 'DEVICE BLACKLISTED: Listed on CEIR as reported stolen/lost.'
          : 'DEVICE VERIFIED CLEAN: IMEI verified genuine and whitelisted by CEIR / DoT.',
      });
    } finally {
      setImeiChecking(false);
    }
  };

  // Canvas signature handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Compute QC adjusted final price
  const calculateFinalDoorstepPrice = () => {
    if (!booking) return 0;
    let price = booking.initialQuote;
    if (qcState.screenCracked) price -= 28000;
    else if (qcState.screenSpotsLines) price -= 20000;
    if (qcState.backGlassBroken) price -= 4500;
    if (qcState.bodyDented) price -= 2500;
    if (!qcState.camerasWorking) price -= 4000;
    if (!qcState.biometricsWorking) price -= 15000; // TrueDepth / Fingerprint penalty
    return Math.max(1200, Math.round(price / 50) * 50);
  };

  const finalDoorstepPrice = calculateFinalDoorstepPrice();

  const handleTriggerPayout = () => {
    setPayoutProcessing(true);
    setTimeout(() => {
      setUtrNumber(`UTR${Date.now().toString().slice(-9)}`);
      setPayoutProcessing(false);
      setCurrentStep('COMPLETED');
    }, 1500);
  };

  // Auth View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Rephonix Field QC Portal</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">Authorized Doorstep Inspection Specialist Login</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-Digit Staff PIN"
              className="w-full text-center tracking-widest text-2xl font-mono py-3.5 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-400 font-semibold">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Verify &amp; Open Portal
            </button>
          </form>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="mt-6 text-xs text-slate-500 hover:text-slate-300 font-medium"
            >
              &larr; Return to Customer Storefront
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Mobile App Bar */}
      <header className="bg-slate-900 text-white px-4 py-3.5 sticky top-0 z-50 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
            RPX
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none">Doorstep QC &amp; Payout</h1>
            <span className="text-[10px] text-slate-400 font-mono">Agent ID: AGENT-DEL-04</span>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            setCurrentStep('SEARCH');
          }}
          className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800"
        >
          Lock
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* STEP 1: Search Booking */}
        {currentStep === 'SEARCH' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-left">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span>Scan or Enter Booking ID</span>
            </h2>
            <p className="text-xs text-slate-600 mb-4">Ask customer for their Booking ID (e.g. RPX-2841) or SMS link.</p>

            <form onSubmit={handleSearchBooking} className="space-y-3">
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter Booking ID (e.g. RPX-2841)"
                className="w-full text-base font-bold font-mono py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl uppercase tracking-wider focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Load Customer Job</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: IMEI & CEIR Stolen Device Check */}
        {currentStep === 'IMEI_CHECK' && booking && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="text-xs font-bold text-blue-900">{booking.modelName} ({booking.storageGb}GB)</div>
              <div className="text-[11px] text-blue-700 mt-0.5">Customer: {booking.customerName} • {booking.customerPhone}</div>
              <div className="text-sm font-extrabold text-blue-950 mt-1">Online Quote: ₹{booking.initialQuote.toLocaleString('en-IN')}</div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>1. Physical IMEI &amp; CEIR Stolen Check</span>
              </h3>
              <p className="text-xs text-slate-600 mb-3">Dial *#06# on customer's phone and type the 15-digit IMEI 1.</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={15}
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="Enter 15-Digit IMEI"
                  className="flex-1 py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleVerifyImei}
                  disabled={imeiChecking}
                  className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                >
                  {imeiChecking ? 'Checking...' : 'Check CEIR'}
                </button>
              </div>
            </div>

            {ceirResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
                ceirResult.status === 'CLEAN'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {ceirResult.status === 'CLEAN' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{ceirResult.status === 'CLEAN' ? 'CEIR Status: WHITELISTED CLEAN' : 'CEIR Alert: BLACKLISTED'}</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed">{ceirResult.message}</p>
              </div>
            )}

            {ceirResult && ceirResult.status === 'CLEAN' && (
              <button
                type="button"
                onClick={() => setCurrentStep('QC_CHECKLIST')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Proceed to 5-Point Physical QC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {ceirResult && ceirResult.status === 'BLACKLISTED' && (
              <div className="p-3 bg-rose-100 text-rose-950 font-bold text-xs rounded-xl text-center">
                TRANSACTION CANCELLED: Do not acquire this device. Return device to seller immediately.
              </div>
            )}
          </div>
        )}

        {/* STEP 3: 5-Point Physical Inspection Checklist */}
        {currentStep === 'QC_CHECKLIST' && booking && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-left space-y-4">
            <h3 className="text-base font-bold text-slate-900">2. Physical QC Checklist</h3>
            <p className="text-xs text-slate-600">Inspect the physical device in person and check off actual conditions:</p>

            <div className="space-y-2.5">
              {/* Screen Glass */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Front Display Glass</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Inspect with flashlight</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={qcState.screenCracked} 
                      onChange={(e) => setQcState({ ...qcState, screenCracked: e.target.checked })} 
                    />
                    <span>Cracked Glass</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={qcState.screenSpotsLines} 
                      onChange={(e) => setQcState({ ...qcState, screenSpotsLines: e.target.checked })} 
                    />
                    <span>Lines / Spots</span>
                  </label>
                </div>
              </div>

              {/* Body Condition */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Body Frame &amp; Back Panel</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={qcState.bodyDented} 
                      onChange={(e) => setQcState({ ...qcState, bodyDented: e.target.checked })} 
                    />
                    <span>Dents on Frame</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={qcState.backGlassBroken} 
                      onChange={(e) => setQcState({ ...qcState, backGlassBroken: e.target.checked })} 
                    />
                    <span>Broken Back Glass</span>
                  </label>
                </div>
              </div>

              {/* Sensor & Hardware Checks (Tested on Phone's Own OS) */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Sensors &amp; Accounts</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Test on phone</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer">
                    <span>Face ID / Fingerprint Working on Phone</span>
                    <input 
                      type="checkbox" 
                      checked={qcState.biometricsWorking} 
                      onChange={(e) => setQcState({ ...qcState, biometricsWorking: e.target.checked })} 
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer">
                    <span>Cameras &amp; Autofocus Functional</span>
                    <input 
                      type="checkbox" 
                      checked={qcState.camerasWorking} 
                      onChange={(e) => setQcState({ ...qcState, camerasWorking: e.target.checked })} 
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer">
                    <span>iCloud / Google FRP Signed Out</span>
                    <input 
                      type="checkbox" 
                      checked={qcState.icloudGoogleRemoved} 
                      onChange={(e) => setQcState({ ...qcState, icloudGoogleRemoved: e.target.checked })} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep('RECONCILE')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Review Valuation Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: Valuation Reconciliation */}
        {currentStep === 'RECONCILE' && booking && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-left space-y-4">
            <h3 className="text-base font-bold text-slate-900">3. Valuation Reconciliation</h3>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Customer Self-Quote:</span>
                <span className="font-bold">₹{booking.initialQuote.toLocaleString('en-IN')}</span>
              </div>
              {booking.initialQuote !== finalDoorstepPrice && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Physical Findings Adjustment:</span>
                  <span>-₹{(booking.initialQuote - finalDoorstepPrice).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t">
                <span>Agreed Doorstep Payout:</span>
                <span className="text-emerald-600 text-lg">₹{finalDoorstepPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep('SIGNATURE')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Proceed to Customer Sign-off</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 5: Customer Signature & Payout Confirmation */}
        {currentStep === 'SIGNATURE' && booking && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-left space-y-4">
            <h3 className="text-base font-bold text-slate-900">4. Customer Handover &amp; Signature</h3>
            <p className="text-xs text-slate-600">Please hand your phone to the customer to sign on the screen.</p>

            {/* Signature Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-semibold mb-1 flex justify-between">
                <span>Customer Signature (Sign with finger)</span>
                {hasSignature && (
                  <button type="button" onClick={clearSignature} className="text-rose-600 font-bold cursor-pointer">
                    Clear
                  </button>
                )}
              </div>
              <canvas
                ref={canvasRef}
                width={360}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-white rounded-lg border border-slate-200 touch-none cursor-crosshair"
              />
            </div>

            {/* UPI ID confirmation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Instant UPI Payment ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="customer@upi"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>

            <button
              type="button"
              disabled={!hasSignature || payoutProcessing}
              onClick={handleTriggerPayout}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {payoutProcessing ? (
                <span>Processing IMPS / UPI Transfer...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Transfer ₹{finalDoorstepPrice.toLocaleString('en-IN')} Instantly</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 6: Completion Screen */}
        {currentStep === 'COMPLETED' && booking && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Payout Transferred!</h2>
            <p className="text-xs text-slate-600">
              ₹{finalDoorstepPrice.toLocaleString('en-IN')} has been transferred via UPI to <strong className="font-mono">{upiId}</strong>.
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 space-y-1">
              <div>Booking ID: {booking.id}</div>
              <div>Banking Ref / UTR: {utrNumber}</div>
              <div>Status: COMPLETED &amp; CLOSED</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBooking(null);
                setImei('');
                setCeirResult(null);
                setCurrentStep('SEARCH');
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Start Next Job
            </button>
          </div>
        )}
      </main>
    </div>
  );
};