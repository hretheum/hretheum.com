'use client';

import { useEffect } from 'react';
import ProfilePage from './ProfilePage';
import CareerPage from './CareerPage';
import CaseStudiesPage from './CaseStudiesPage';
import LeadershipPage from './LeadershipPage';
import AIBuilderPage from './AIBuilderPage';
import OtherProjectsPage from './OtherProjectsPage';
import ClosingPage from './ClosingPage';
import RagChat from './RagChat';

export default function Content() {
  useEffect(() => {
    // Track section visibility for scroll tracking
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px 0px -20% 0px',
    } as const;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && typeof window !== 'undefined' && (window as any).dataLayer) {
          const sectionName = entry.target.getAttribute('data-section');
          if (sectionName) {
            (window as any).dataLayer.push({
              event: 'section_view',
              event_category: 'engagement',
              event_label: sectionName,
              section_name: sectionName,
            });
          }
        }
      });
    }, observerOptions);

    // Observe all sections inside this component
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-0 print:pt-0">
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
