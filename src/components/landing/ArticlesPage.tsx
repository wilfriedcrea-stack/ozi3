import React, { useEffect } from 'react';
import { PressSection } from './PressSection';

export const ArticlesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <div className="pt-2 min-h-[70vh]">
      <PressSection />
    </div>
  );
};
