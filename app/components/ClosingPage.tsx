export default function ClosingPage() {
  const handleCTAClick = () => {
    // Track CTA click event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        event_category: 'engagement',
        event_label: 'closing_page_cta',
        value: 1
      });
    }
  };

  const handleLinkedInClick = () => {
    // Track LinkedIn click event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'outbound_link_click',
        event_category: 'social',
        event_label: 'linkedin',
        outbound_url: 'https://linkedin.com/in/eofek'
      });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-x-hidden bg-black text-white">
      {/* Neon Slash */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200%] h-2 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform -rotate-12 opacity-90"></div>
      </div>
      
      {/* Main Content */}
      <div className="text-center z-10 px-4 sm:px-6 max-w-6xl">
        <h1 className="text-[clamp(2.25rem,9vw,3.25rem)] md:text-[6rem] lg:text-[8rem] font-black leading-[1.02] tracking-tight mb-10 break-words [text-wrap:balance]">
          HIRE ME<br/>
          OR STAY<br/>
          IRRELEVANT.
        </h1>
        
        <div className="mb-8">
          <a 
            href="https://calendly.com/eorlowski-theeventa/short-intro"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCTAClick}
            className="inline-block bg-white text-black px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-black hover:bg-purple-200 transition-colors duration-200"
          >
            Schedule a meeting
          </a>
        </div>
        
        <div className="bg-purple-600 p-6 md:p-8 inline-block text-left md:text-center">
          <div className="text-xl md:text-2xl font-black mb-3 md:mb-4">CONTACT</div>
          <div className="text-lg md:text-xl">eof@offline.pl</div>
          <div className="text-lg md:text-xl">+48 535 555 066</div>
          <a 
            href="https://linkedin.com/in/eofek" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleLinkedInClick}
            className="text-base md:text-lg hover:text-purple-200 underline transition-colors duration-200"
          >
            linkedin.com/in/eofek
          </a>
        </div>
      </div>
    </section>
  );
}