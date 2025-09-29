import dynamic from 'next/dynamic';
import CoverPage from './components/CoverPage';
import ProfilePage from './components/ProfilePage';
import SectionObserver from './components/SectionObserver';
import RagChat from './components/RagChatLazy';

// Lazy load components below the fold for better LCP
const CareerPage = dynamic(() => import('./components/CareerPage'), { ssr: true });
const CaseStudiesPage = dynamic(() => import('./components/CaseStudiesPage'), { ssr: true });
const AIOriginalsPage = dynamic(() => import('./components/AIOriginalsPage'), { ssr: true });
const LeadershipPage = dynamic(() => import('./components/LeadershipPage'), { ssr: true });
const AIBuilderPage = dynamic(() => import('./components/AIBuilderPage'), { ssr: true });
const OtherProjectsPage = dynamic(() => import('./components/OtherProjectsPage'), { ssr: true });
const ClosingPage = dynamic(() => import('./components/ClosingPage'), { ssr: true });

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SectionObserver />
      {/* Single Page Content */}
      <div className="pt-16 print:pt-0">
        <div data-section="cover"><CoverPage /></div>
        <div data-section="profile"><ProfilePage /></div>
        <div data-section="career"><CareerPage /></div>
        <div data-section="case-studies"><CaseStudiesPage /></div>
        <div data-section="ai-originals"><AIOriginalsPage /></div>
        <div data-section="leadership"><LeadershipPage /></div>
        <div data-section="ai-builder"><AIBuilderPage /></div>
        <div data-section="other-projects"><OtherProjectsPage /></div>
        <div data-section="closing"><ClosingPage /></div>
      </div>
      {/* Sticky chat overlay */}
      <RagChat />
    </div>
  );
}