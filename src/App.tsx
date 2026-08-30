import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import { TopBanner } from './components/landing/TopBanner';
import { Navbar } from './components/landing/Navbar';
import { AccueilPage } from './components/landing/AccueilPage';
import { OeuvresPage } from './components/landing/OeuvresPage';
import { ArticlesPage } from './components/landing/ArticlesPage';
import { Footer } from './components/landing/Footer';
import { WebtoonReaderModal } from './components/landing/WebtoonReaderModal';
import { TeaserVideoModal } from './components/landing/TeaserVideoModal';
import { AdminStudio } from './components/admin/AdminStudio';

const MainLayout: React.FC = () => {
  const { viewMode } = useData();

  if (viewMode === 'admin') {
    return <AdminStudio />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 font-sans flex flex-col justify-between">
      <div>
        {/* Top Image Banner before Header */}
        <TopBanner />

        {/* Sticky Header Navbar */}
        <Navbar />

        {/* Dynamic Page Views */}
        <main>
          {viewMode === 'accueil' && <AccueilPage />}
          {viewMode === 'oeuvres' && <OeuvresPage />}
          {viewMode === 'articles' && <ArticlesPage />}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <WebtoonReaderModal />
      <TeaserVideoModal />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
}
