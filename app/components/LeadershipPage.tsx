export default function LeadershipPage() {
  return (
    <section className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[4rem] md:text-[6rem] font-black text-gray-900 mb-16 leading-none text-center">
          LEADERSHIP
        </h1>
        
        {/* Philosophy & Core Skills */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Leadership blocks */}
            <div className="space-y-8">
              <div className="bg-gray-900 text-white p-8">
                <h3 className="text-2xl font-black mb-4">TRIBE/CHAPTER MODELS</h3>
                <p className="text-lg">Spotify-like organizations</p>
              </div>
              
              <div className="bg-purple-600 text-white p-8">
                <h3 className="text-2xl font-black mb-4">COACHING DESIGNERS</h3>
                <p className="text-lg">Into senior and lead roles</p>
              </div>
              
              <div className="bg-gray-900 text-white p-8">
                <h3 className="text-2xl font-black mb-4">MULTIDISCIPLINARY</h3>
                <p className="text-lg">Business • IT • Ops • Product • Data Science</p>
              </div>
              
              <div className="bg-purple-600 text-white p-8">
                <h3 className="text-2xl font-black mb-4">STAKEHOLDER BUY-IN</h3>
                <p className="text-lg">Senior leadership alignment</p>
              </div>
            </div>

            {/* Giant quote */}
            <div className="flex items-center justify-center">
              <div className="bg-black text-white p-12 text-center">
                <blockquote className="text-3xl md:text-4xl font-black leading-tight">
                  &quot;SENIOR DESIGNERS<br/>
                  SHOULD CODE,<br/>
                  NOT JUST<br/>
                  COORDINATE.&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        {/* Product Design Leadership Playbook */}
        <div className="mb-20">
          <h2 className="text-[3rem] md:text-[4rem] font-black text-purple-600 mb-12 leading-none">
            PRODUCT DESIGN<br/>LEADERSHIP PLAYBOOK
          </h2>
          
          <div className="bg-gray-50 p-8 mb-12">
            <p className="text-xl leading-relaxed text-gray-800">
              As a design leader, my role is to establish not only outcomes, but also the systems and environments where design thrives. 
              Below are the key principles, methods, and tools I apply when embedding Product Design and Research into organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Org Models & Embedding */}
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-xl font-black mb-4 text-purple-400">ORG MODELS & EMBEDDING</h3>
              <ul className="space-y-2 text-sm">
                <li className="pl-2 -indent-2">• Tribe/Chapter (Spotify-style) models with embedded designers in squads</li>
                <li className="pl-2 -indent-2">• Dual reporting lines: craft leadership and squad delivery alignment</li>
                <li className="pl-2 -indent-2">• Clear interfaces between Design, Product, and Engineering</li>
              </ul>
            </div>

            {/* Discovery & Delivery Balance */}
            <div className="bg-purple-600 text-white p-8">
              <h3 className="text-xl font-black mb-4">DISCOVERY & DELIVERY</h3>
              <ul className="space-y-2 text-sm">
                <li className="pl-2 -indent-2">• Shift-left discovery: embed research upfront</li>
                <li className="pl-2 -indent-2">• Continuous discovery alongside agile delivery</li>
                <li className="pl-2 -indent-2">• Discovery playbooks: IDIs, diary studies, JTBD interviews</li>
              </ul>
            </div>

            {/* Design Ops & Systems */}
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-xl font-black mb-4 text-purple-400">DESIGN OPS & SYSTEMS</h3>
              <ul className="space-y-2 text-sm">
                <li className="pl-2 -indent-2">• Scalable design systems with governance</li>
                <li className="pl-2 -indent-2">• Figma libraries, tokens, accessibility baked in</li>
                <li className="pl-2 -indent-2">• Contribution models: squads feed back into system</li>
              </ul>
            </div>

            {/* Research Ops */}
            <div className="bg-purple-600 text-white p-8">
              <h3 className="text-xl font-black mb-4">RESEARCH OPS</h3>
              <ul className="space-y-2 text-sm">
                <li className="pl-2 -indent-2">• Centralized research repository (Aurelius, Dovetail)</li>
                <li className="pl-2 -indent-2">• Standardized recruitment, incentives, templates</li>
                <li className="pl-2 -indent-2">• Democratization: enable PMs and engineers to observe</li>
              </ul>
            </div>

            {/* Quality & Feedback Loops */}
            <div className="bg-gray-900 text-white p-8">
              <h3 className="text-xl font-black mb-4 text-purple-400">QUALITY & FEEDBACK</h3>
              <ul className="space-y-2 text-sm">
                <li className="pl-2 -indent-2">• Regular design critiques and rituals</li>
                <li className="pl-2 -indent-2">• Review systems that raise craft bar</li>
                <li className="pl-2 -indent-2">• Metrics: adoption, usability scores, support tickets</li>
              </ul>
            </div>

            {/* AI & Future-Forward Practice */}
            <div className="bg-purple-600 text-white p-8">
              <h3 className="text-xl font-black mb-4">AI & FUTURE-FORWARD</h3>
              <ul className="space-y-2 text-sm">
                <li className="pl-2 -indent-2">• AI-assisted design tools for faster prototyping</li>
                <li className="pl-2 -indent-2">• LLMs to synthesize research findings</li>
                <li className="pl-2 -indent-2">• Agentic AI systems for design ops automation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pull Quote */}
        <div className="bg-black text-white p-12 text-center">
          <blockquote className="text-3xl md:text-4xl font-black leading-tight">
            &quot;DESIGN LEADERSHIP<br/>
            IS ABOUT CREATING<br/>
            CONDITIONS WHERE<br/>
            GREAT DESIGN<br/>
            BECOMES INEVITABLE.&quot;
          </blockquote>
        </div>
      </div>
    </section>
  );
}