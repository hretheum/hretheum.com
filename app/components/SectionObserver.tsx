"use client";

import { useEffect } from "react";

export default function SectionObserver() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.5,
      rootMargin: "0px 0px -20% 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && typeof window !== "undefined" && (window as any).dataLayer) {
          const sectionName = entry.target.getAttribute("data-section");
          if (sectionName) {
            (window as any).dataLayer.push({
              event: "section_view",
              event_category: "engagement",
              event_label: sectionName,
              section_name: sectionName,
            });
          }
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return null;
}
