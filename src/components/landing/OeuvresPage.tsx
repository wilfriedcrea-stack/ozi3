import React, { useEffect } from 'react';
import { SeriesCatalog } from './SeriesCatalog';

export const OeuvresPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <div className="pt-2 min-h-[70vh]">
      <SeriesCatalog />
    </div>
  );
};
