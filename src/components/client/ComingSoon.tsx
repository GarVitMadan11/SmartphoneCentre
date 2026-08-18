import { Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between items-center relative overflow-hidden font-sans px-4 py-8 select-none">
      {/* Background gradients for premium glassmorphism/ambient effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#22c55e]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#10b981]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto flex justify-center items-center py-4 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" className="w-12 h-12 object-contain rounded-xl" alt="Rephonix Logo" />
          <span className="text-2xl font-bold tracking-tight text-white">
            Re<span className="text-[#22c55e]">phonix</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center z-10 py-12">
        {/* Premium Launching Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm font-semibold tracking-wider uppercase mb-8 animate-pulse">
          <Sparkles className="w-4 h-4" />
          Launching Soon
        </div>

        {/* Hero Heading */}
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Something Big <br />
          Is <span className="bg-gradient-to-r from-[#22c55e] via-[#10b981] to-[#059669] text-transparent bg-clip-text">Coming.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
          We're building a smarter way to sell your devices.
        </p>

        {/* Features / Value Props grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl w-full text-left mb-8">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:border-[#22c55e]/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Instant Value</h3>
            <p className="text-sm text-gray-400">Get instant, competitive quotes for your smartphones, tablets, and smartwatches.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:border-[#22c55e]/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Secure Diagnostics</h3>
            <p className="text-sm text-gray-400">Transparent AI-driven diagnostics ensuring you get the fairest price for your device condition.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:border-[#22c55e]/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] mb-4">
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Hassle-Free</h3>
            <p className="text-sm text-gray-400">Easy door-step pickups and instant payouts upon verification.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center py-4 border-t border-white/[0.05] z-10 text-xs text-gray-500 gap-4">
        <div>
          &copy; {new Date().getFullYear()} Rephonix. All rights reserved.
        </div>
        <div className="flex gap-4">
          <span className="text-[#22c55e]">Smarter Device Lifecycle</span>
        </div>
      </footer>
    </div>
  );
}
