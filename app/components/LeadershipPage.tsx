export default function LeadershipPage() {
  return (
    <section className="min-h-screen bg-white pt-16 md:pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Clamp heading to avoid clipping on very small screens */}
        <h1 className="text-[clamp(2.25rem,9vw,3.5rem)] md:text-[6rem] font-black text-gray-900 mb-8 md:mb-12 leading-[1.02] tracking-tight text-center break-words [text-wrap:balance]">
          LEADERSHIP
        </h1>
        {/* Core Leadership areas — 2x2 dark cards */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-2xl font-black mb-1">ORG MODELS</h3>
              <div className="text-[11px] font-bold text-gray-400 tracking-wide">DETAILS</div>
              <p className="text-base mt-1">Tribe/Chapter, clear interfaces</p>
            </div>
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-2xl font-black mb-1">COACHING</h3>
              <div className="text-[11px] font-bold text-gray-400 tracking-wide">DETAILS</div>
              <p className="text-base mt-1">Senior → Lead growth</p>
            </div>
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-2xl font-black mb-1">CROSS-FUNCTIONAL</h3>
              <div className="text-[11px] font-bold text-gray-400 tracking-wide">DETAILS</div>
              <p className="text-base mt-1">Product • Eng • Data • QA</p>
            </div>
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-2xl font-black mb-1">STAKEHOLDER BUY-IN</h3>
              <div className="text-[11px] font-bold text-gray-400 tracking-wide">DETAILS</div>
              <p className="text-base mt-1">Alignment with senior leadership</p>
            </div>
          </div>
        </div>
        {/* Blue callout */}
        <div className="-mx-6 md:mx-0 mb-20">
          <div className="bg-blue-600 text-white p-6 md:p-8 text-center w-full">
            <blockquote className="text-lg md:text-2xl font-black leading-tight break-words [text-wrap:balance]">
              SENIOR DESIGNERS SHOULD BUILD, NOT JUST COORDINATE.
            </blockquote>
          </div>
        </div>

        {/* Product Design Leadership Playbook */}
        <div className="mb-20">
          <h2 className="text-[clamp(1.75rem,7.5vw,2.5rem)] md:text-[4rem] font-black text-gray-900 mb-8 md:mb-12 leading-[1.05] tracking-tight break-words [text-wrap:balance] text-center">
            PRODUCT DESIGN<br/>LEADERSHIP PLAYBOOK
          </h2>
          {/* Light two-column lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-blue-600 font-black tracking-tight mb-3">DISCOVERY & DELIVERY</h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-800">
                <li>Shift-left discovery: embed research upfront</li>
                <li>Continuous discovery alongside agile delivery</li>
                <li>Prototypes that de-risk</li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-600 font-black tracking-tight mb-3">DESIGN OPS & SYSTEMS</h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-800">
                <li>Scalable systems with governance</li>
                <li>Figma libraries, tokens, accessibility</li>
                <li>Contribution model from squads</li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-600 font-black tracking-tight mb-3">QUALITY & FEEDBACK</h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-800">
                <li>Regular critiques</li>
                <li>Raising craft bar</li>
                <li>Metrics: adoption, usability</li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-600 font-black tracking-tight mb-3">RESEARCH OPS</h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-800">
                <li>Centralized repository (Aurelius, Dovetail)</li>
                <li>Standardized recruitment and templates</li>
                <li>Democratization: enable PMs/engineers to observe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}