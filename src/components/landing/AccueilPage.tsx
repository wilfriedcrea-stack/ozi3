import React from 'react';
import { HeroSection } from './HeroSection';
import { TeasersSection } from './TeasersSection';
import { ApkDownloadSection } from './ApkDownloadSection';
import { CreatorsSection } from './CreatorsSection';
import { CommunityFaq } from './CommunityFaq';

export const AccueilPage: React.FC = () => {
  return (
    <div>
      {/* 1. Hero Presentation & APK CTA */}
      <HeroSection />

      {/* 2. Official Video Teasers & Trailers */}
      <TeasersSection />

      {/* 3. APK Download & PWA Mobile Showcase */}
      <ApkDownloadSection />

      {/* 4. Creator Hub & Artist Submissions */}
      <CreatorsSection />

      {/* 5. Community & FAQ */}
      <CommunityFaq />
    </div>
  );
};
