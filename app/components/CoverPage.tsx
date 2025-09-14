export default function CoverPage() {
  const handleCTAClick = () => {
    // Track CTA click event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        event_category: 'engagement',
        event_label: 'cover_page_cta',
        value: 1
      });
    }
  };

  return (
    // Use overflow-x-hidden to avoid clipping the neon slash horizontally while allowing vertical flow
    <section className="min-h-screen flex items-center justify-center relative overflow-x-hidden bg-white">
      {/* Neon Slash */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200%] h-2 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform rotate-12 opacity-90"></div>
      </div>
      
      {/* Main Content */}
      <div className="text-center z-10 px-4 sm:px-6">
        {/* Responsive clamp to avoid clipping on very small screens; safer line-height and wrapping */}
        <h1 className="text-[clamp(2.25rem,10vw,3.75rem)] md:text-[8rem] lg:text-[12rem] font-black text-gray-900 leading-[0.95] tracking-tight mb-8 break-words [text-wrap:balance]">
          HIRE TASTE.<br />FIRE MEDIOCRITY.
        </h1>
        <div className="mt-8 md:mt-12 space-y-3 md:space-y-4">
          <p className="text-xl md:text-4xl font-black text-gray-700">
            ERYK ORŁOWSKI
          </p>
          <p className="text-lg md:text-2xl font-bold text-gray-500">
            PRODUCT DESIGN LEADER
          </p>
          <div className="mt-8">
            <a 
              href="https://calendly.com/eorlowski-theeventa/short-intro"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCTAClick}
              className="inline-block border border-gray-300 text-gray-600 px-5 py-3 text-sm md:text-base font-medium hover:border-gray-400 hover:text-gray-700 transition-all duration-200"
            >
              Schedule a meeting
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}