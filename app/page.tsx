'use client';

import { useEffect } from 'react';
import CoverPage from './components/CoverPage';
import ProfilePage from './components/ProfilePage';
import CareerPage from './components/CareerPage';
import CaseStudiesPage from './components/CaseStudiesPage';
import LeadershipPage from './components/LeadershipPage';
import AIBuilderPage from './components/AIBuilderPage';
import OtherProjectsPage from './components/OtherProjectsPage';
import ClosingPage from './components/ClosingPage';
import RagChat from './components/RagChat';

export default function Home() {
  useEffect(() => {
    // Track section visibility for scroll tracking
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px 0px -20% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && typeof window !== 'undefined' && (window as any).dataLayer) {
          const sectionName = entry.target.getAttribute('data-section');
          if (sectionName) {
            (window as any).dataLayer.push({
              event: 'section_view',
              event_category: 'engagement',
              event_label: sectionName,
              section_name: sectionName
            });
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Single Page Content */}
      <div className="pt-16 print:pt-0">
        <div data-section="cover"><CoverPage /></div>
        <div data-section="profile"><ProfilePage /></div>
        <div data-section="career"><CareerPage /></div>
        <div data-section="case-studies"><CaseStudiesPage /></div>
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