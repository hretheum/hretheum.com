import { SectionTitle, CaseGrid, OutcomeBanner } from '@/app/components/ui'

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

  const items = cases.map(c => ({
    title: c.title,
    subtitle: c.subtitle,
    challenge: c.challenge,
    solution: c.solution,
    outcome: c.outcome,
    details: c.details,
  }))

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto" style={{ ['--campaign-accent' as any]: '#7c3aed' }}>
        <SectionTitle title="Case Studies" subtitle="Selected outcomes across industries" />
        {/* Enforce two columns per row on wider screens */}
        <CaseGrid items={items} colsClass="grid-cols-1 md:grid-cols-2 xl:grid-cols-2" />
        <OutcomeBanner text={"MEASURABLE IMPACT: IMPROVED ADOPTION • REDUCED COSTS • HIGHER SUCCESS RATES"} />
      </div>
    </section>
  );
}