import CoverPage from './components/CoverPage';
import ProfilePage from './components/ProfilePage';
import CareerPage from './components/CareerPage';
import CaseStudiesPage from './components/CaseStudiesPage';
import AIOriginalsPage from './components/AIOriginalsPage';
import LeadershipPage from './components/LeadershipPage';
import AIBuilderPage from './components/AIBuilderPage';
import OtherProjectsPage from './components/OtherProjectsPage';
import ClosingPage from './components/ClosingPage';
import RagChat from './components/RagChat';
import SectionObserver from './components/SectionObserver';

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