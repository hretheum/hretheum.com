export default function CaseStudiesPage() {
  const cases = [
    {
      title: "ING BUSINESS",
      subtitle: "SME PERMISSION MANAGEMENT",
      challenge: "COMPLEX ACCESS PROCESS",
      solution: "NATURAL LANGUAGE WORKFLOWS",
      outcome: "REDUCED SUPPORT COSTS",
      details: "Complex, unclear access & authorization process causing heavy support load. Applied personas, journey mapping, IDIs, Design Studio, prototype testing. Created contextual workflows + natural language questions replacing legalese. Result: improved adoption, reduced support costs, higher task success rates."
    },
    {
      title: "BANQUP",
      subtitle: "DIGITAL BANK PLATFORM",
      challenge: "PERSONALIZATION AT SCALE",
      solution: "CONTEXTUAL ONBOARDING",
      outcome: "TAILORED SME EXPERIENCE",
      details: "BanqUP needed personalization at scale for different small businesses. Designed onboarding flows with simple questions to unlock personalized features. Created tagging tools, smart analytics, and integrated dashboards. Result: tailored experience combining simplicity with flexibility."
    },
    {
      title: "BANK BPH",
      subtitle: "DIGITAL CONVERSION",
      challenge: "REGULATED ENVIRONMENT",
      solution: "JOURNEY TRANSFORMATION",
      outcome: "SEAMLESS EXPERIENCES",
      details: "Redesigned end-to-end digital conversion paths in highly regulated banking environment. Applied workflow design, wireframing tools, and conversion optimization methodologies. Orchestrated user journey transformations using advanced wireframing and prototyping. Result: improved conversion rates, user satisfaction, and business KPIs."
    },
    {
      title: "WARTA.PL",
      subtitle: "INSURTECH OVERHAUL",
      challenge: "CRITICAL BARRIERS",
      solution: "SERVICE DESIGN INITIATIVE",
      outcome: "CUSTOMER-CENTRIC EXPERIENCE",
      details: "Orchestrated end-to-end service design initiative for Poland's largest insurer. Started with discovery interviews, workshops, and journey mapping to uncover critical barriers. Used progressive disclosure, smart defaults, and wireframed prototypes to streamline car insurance quote funnel. Result: customer-centric InsurTech experience with improved usability scores."
    },
    {
      title: "PKO BANK",
      subtitle: "iPKO BIZNES REDESIGN",
      challenge: "18-MONTH TRANSFORMATION",
      solution: "ENTERPRISE WORKFLOWS",
      outcome: "B2B SAAS PLATFORM",
      details: "18-month digital transformation of Poland's largest corporate e-banking platform. Led 3-month discovery phase with structured interviews, stakeholder workshops, and journey mapping. Defined design systems, aligned complex enterprise workflows, facilitated cross-functional collaboration. Result: future-ready B2B SaaS banking platform balancing security, usability, and scalability."
    },
    {
      title: "TELECOM",
      subtitle: "T-MOBILE • PLUS • TP SA",
      challenge: "CONVERSION OPTIMIZATION",
      solution: "USABILITY AT SCALE",
      outcome: "INCREASED PURCHASES",
      details: "T-Mobile: Rebuilt e-shop conversion paths using usability testing and conversion funnel analysis. Plus.pl: Full redesign applying information architecture and visual design systems. TP SA: Redesigned multiple conversion flows across telecom products. All projects required cross-functional collaboration to align business KPIs with user-centered design."
    },
    {
      title: "MEDIA",
      subtitle: "CYFROWY POLSAT • TVP • POLSKA TIMES",
      challenge: "LARGE-SCALE PUBLISHING",
      solution: "CONTENT DISCOVERABILITY",
      outcome: "DIGITAL ECOSYSTEMS",
      details: "Cyfrowy Polsat: Redesigned cyfrowypolsat.pl, iCOK, rozrywka-online, polsatsport.pl focusing on content discoverability. Polska Times: Designed publishing processes for 16 local titles using workflow mapping. TVP: 7 years of collaboration on tvp.pl, tvp.info, regional portals with stakeholder alignment workshops and accessibility improvements."
    }
  ];

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[4rem] md:text-[6rem] font-black text-gray-900 mb-16 leading-none text-center">
          CASE STUDIES
        </h1>
        
        <p className="text-center text-gray-400 text-sm mb-12 -mt-8">
          hint: hover over the items for details
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((case_, index) => (
            <div 
              key={index} 
              className="bg-black text-white p-8 hover:bg-purple-600 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              {/* Main content - always visible */}
              <div className="group-hover:opacity-0 transition-opacity duration-300">
                <h2 className="text-2xl font-black mb-2">{case_.title}</h2>
                <h3 className="text-lg font-bold text-purple-400 mb-6">{case_.subtitle}</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-bold text-gray-400">CHALLENGE</div>
                    <div className="text-sm">{case_.challenge}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-400">SOLUTION</div>
                    <div className="text-sm">{case_.solution}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-400">OUTCOME</div>
                    <div className="text-sm font-bold text-purple-400">{case_.outcome}</div>
                  </div>
                </div>
              </div>

              {/* Detailed content - shown on hover */}
              <div className="absolute inset-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-600 flex items-center">
                <div>
                  <h2 className="text-xl font-black mb-4">{case_.title}</h2>
                  <p className="text-sm leading-relaxed">{case_.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Big outcome statement */}
        <div className="mt-16 bg-purple-600 text-white p-12 text-center -mx-6 md:mx-0">
          <div className="text-3xl md:text-4xl font-black">
            MEASURABLE IMPACT:<br/>
            IMPROVED ADOPTION • REDUCED COSTS • HIGHER SUCCESS RATES
          </div>
        </div>
      </div>
    </section>
  );
}