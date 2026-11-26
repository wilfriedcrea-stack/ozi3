import React from 'react';
import { HomeFeaturedShowcase } from './HomeFeaturedShowcase';
import { HeroSection } from './HeroSection';

export const AccueilPage: React.FC = () => {
  return (
    <div>
      {/* 0. Top Artwork Showcase: Logo overlay, Dark Gradient, Synopsis & Read CTA */}
      <HomeFeaturedShowcase />

      {/* 1. Hero Presentation & APK CTA */}
      <HeroSection />
    </div>
  );
};
