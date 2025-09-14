export default function CareerPage() {
  return (
    <section className="min-h-screen bg-white py-16 px-6 page-break">
      <div className="max-w-7xl mx-auto">
        {/* Pure typography blocks */}
        <div className="space-y-20">
          {/* Sportradar */}
          <div className="text-center">
            {/* Responsive clamp to prevent clipping on very small screens */}
            <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-purple-600 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
              SPORTRADAR
            </h2>
            <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-purple-600 mb-1">
              2022–2025
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              TRIBE PRODUCT DESIGN LEAD • 15+ SQUADS
            </div>
          </div>

          {/* ING Bank */}
          <div className="text-center">
            <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-gray-900 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
              ING BANK
            </h2>
            <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-gray-900 mb-1">
              2017–2022
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              UX PRINCIPAL EXPERT • BUSINESS BANKING
            </div>
          </div>

          {/* Deloitte */}
          <div className="text-center">
            <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-purple-600 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
              DELOITTE
            </h2>
            <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-purple-600 mb-1">
              2015–2016
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              UX MANAGER • ENTERPRISE SCALE
            </div>
          </div>

          {/* Komitywa */}
          <div className="text-center">
            <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-gray-900 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
              KOMITYWA
            </h2>
            <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-gray-900 mb-1">
              2007–2009
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              CO-FOUNDER • POLAND&apos;S EARLIEST UX AGENCY
            </div>
          </div>

          {/* MRM Worldwide */}
          <div className="text-center">
            <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-purple-600 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
              MRM WORLDWIDE
            </h2>
            <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-purple-600 mb-1">
              2006–2007
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              UX DIRECTOR
            </div>
          </div>

          {/* Offline.pl */}
          <div className="relative -mx-6 md:-mx-12 lg:-mx-24">
            <div className="bg-gray-50 py-16 px-6 md:px-12 lg:px-24">
              <div className="text-center">
                <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-emerald-600 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
                  OFFLINE.PL
                </h2>
                <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-emerald-600 mb-1">
                  2004–2017
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-600">
                  UX LEAD • POLAND&apos;S FIRST USABILITY LAB
                </div>
              </div>
            </div>
          </div>

          {/* Grey/Argonauts */}
          <div className="text-center">
            <h2 className="text-[clamp(2rem,9vw,3.25rem)] md:text-[6rem] font-black text-gray-900 mb-3 leading-[1.02] tracking-tight break-words [text-wrap:balance]">
              GREY
            </h2>
            <div className="text-[clamp(1.25rem,5.5vw,1.75rem)] md:text-[3rem] font-black text-gray-900 mb-1">
              2003–2006
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              UX LEAD • POLAND&apos;S FIRST USABILITY LAB
            </div>
          </div>
        </div>

        {/* Earlier roles - simple typography */}
        <div className="mt-32 text-center">
          <h3 className="text-[2rem] md:text-[3rem] font-black text-gray-400 mb-8">
            EARLIER
          </h3>
          <div className="text-xl md:text-2xl font-bold text-gray-600">
            WPROST ONLINE • RADIO ZET • FORUM PUBLISHING
          </div>
        </div>
      </div>
    </section>
  );
}