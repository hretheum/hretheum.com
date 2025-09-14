export default function OtherProjectsPage() {
  const categories = [
    {
      title: "DATA SCIENCE",
      color: "bg-purple-600",
      projects: [
        { name: "PFIZER", details: "UX design for data management tools in pharmaceutical research environment" },
        { name: "NEC", details: "Predictive analytics tool design for product website and data visualization" }
      ]
    },
    {
      title: "TELECOM",
      color: "bg-gray-900",
      projects: [
        { name: "T-MOBILE", details: "E-shop conversion path redesign using usability testing and funnel analysis" },
        { name: "PLUS.PL", details: "Full platform redesign (2008) applying information architecture and visual systems" },
        { name: "TP SA", details: "Multiple conversion flow redesigns across telecom products for consistency" }
      ]
    },
    {
      title: "MEDIA",
      color: "bg-purple-600",
      projects: [
        { name: "CYFROWY POLSAT", details: "Redesign of cyfrowypolsat.pl, iCOK, rozrywka-online, polsatsport.pl focusing on content discoverability" },
        { name: "POLSKA TIMES", details: "Online publishing process design capable of aggregating content from 16 local titles" },
        { name: "TVP", details: "7 years of projects: tvp.pl, tvp.info, TVP Sport, regional platforms with accessibility improvements" }
      ]
    },
    {
      title: "BIG PHARMA",
      color: "bg-gray-900",
      projects: [
        { name: "SERVIER", details: "12 months of mobile application projects for major pharmaceutical company" }
      ]
    },
    {
      title: "FINANCIAL",
      color: "bg-purple-600",
      projects: [
        { name: "BANK BPH", details: "End-to-end digital conversion paths redesign with workflow design and conversion optimization" },
        { name: "WARTA.PL", details: "Service design initiatives with user insights, journey mapping, and InsurTech experience optimization" },
        { name: "PKO BANK", details: "iPKO Biznes corporate e-banking redesign - 18-month transformation including 3-month discovery" }
      ]
    },
    {
      title: "E-COMMERCE",
      color: "bg-gray-900",
      projects: [
        { name: "OPONEO.PL", details: "E-commerce optimization for automotive parts and tire sales platform" },
        { name: "PHILIPS", details: "Consumer electronics e-commerce experience design and optimization" },
        { name: "NESTLÉ", details: "Food and beverage brand digital experience and e-commerce flows" },
        { name: "ORLEN", details: "Energy sector digital transformation and customer experience design" }
      ]
    }
  ];

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[clamp(2rem,9vw,2.75rem)] md:text-[6rem] font-black text-gray-900 mb-16 leading-[1.02] tracking-tight text-center break-words [text-wrap:balance]">
          OTHER PROJECTS
        </h1>
        
        <p className="text-center text-gray-400 text-sm mb-12 -mt-8">
          hint: hover over the items for details
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div key={index} className={`${category.color} text-white p-8 group`}>
              <h2 className="text-2xl font-black mb-6">{category.title}</h2>
              <div className="space-y-4">
                {category.projects.map((project, projectIndex) => (
                  <div 
                    key={projectIndex} 
                    className="relative cursor-pointer group/project"
                  >
                    {/* Project name - always visible */}
                    <div className="text-lg font-bold group-hover/project:opacity-0 transition-opacity duration-300">
                      {project.name}
                    </div>
                    
                    {/* Project details - shown on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover/project:opacity-100 transition-opacity duration-300 bg-black/90 p-3 -m-3 rounded z-10 min-h-[80px] flex flex-col justify-center">
                      <div className="text-sm font-bold text-purple-400 mb-1">{project.name}</div>
                      <div className="text-xs leading-relaxed">{project.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Keywords block */}
        <div className="mt-16 bg-black text-white p-8">
          <h3 className="text-xl font-black mb-4">KEYWORDS</h3>
          <div className="text-sm leading-relaxed">
            UX STRATEGY • DESIGN LEADERSHIP • STAKEHOLDER ALIGNMENT • USER RESEARCH • PROTOTYPING • WIREFRAMING • INFORMATION ARCHITECTURE • DESIGN SYSTEMS • B2B SAAS • ACCESSIBILITY • CONVERSION OPTIMIZATION • SERVICE DESIGN • MENTORING • TEAM LEADERSHIP
          </div>
        </div>
      </div>
    </section>
  );
}