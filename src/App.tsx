import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import { TopBanner } from './components/landing/TopBanner';
import { Navbar } from './components/landing/Navbar';
import { AccueilPage } from './components/landing/AccueilPage';
import { OeuvresPage } from './components/landing/OeuvresPage';
import { ArticlesPage } from './components/landing/ArticlesPage';
import { SearchPage } from './components/landing/SearchPage';
import { ArticleDetailPage } from './components/landing/ArticleDetailPage';
import { OeuvreDetailPage } from './components/landing/OeuvreDetailPage';
import { ArtistsPage } from './components/artists/ArtistsPage';
import { ArtistDetailPage } from './components/artists/ArtistDetailPage';
import { ArtbookDetailPage } from './components/artists/ArtbookDetailPage';
import { Footer } from './components/landing/Footer';
import { WebtoonReaderModal } from './components/landing/WebtoonReaderModal';
import { TeaserVideoModal } from './components/landing/TeaserVideoModal';
import { AdminStudio } from './components/admin/AdminStudio';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { PullToRefresh } from './components/landing/PullToRefresh';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';

const MainLayout: React.FC = () => {
  const { viewMode, adminAuth } = useData();

  if (viewMode === 'admin') {
    if (!adminAuth.isAuthenticated) {
      return <AdminLoginPage />;
    }
    return <AdminStudio />;
  }

  return (
    <PullToRefresh>
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
            {viewMode === 'artistes' && <ArtistsPage />}
            {viewMode === 'articles' && <ArticlesPage />}
            {viewMode === 'recherche' && <SearchPage />}
            {viewMode === 'article-detail' && <ArticleDetailPage />}
            {viewMode === 'oeuvre-detail' && <OeuvreDetailPage />}
            {viewMode === 'artiste-detail' && <ArtistDetailPage />}
            {viewMode === 'artbook-detail' && <ArtbookDetailPage />}
            {/* Fallback to Accueil if viewMode is unrecognized */}
            {!['accueil', 'oeuvres', 'artistes', 'articles', 'recherche', 'article-detail', 'oeuvre-detail', 'artiste-detail', 'artbook-detail'].includes(viewMode) && (
              <AccueilPage />
            )}
          </main>
        </div>

        {/* Footer */}
        <Footer />

        {/* Global Modals */}
        <WebtoonReaderModal />
        <TeaserVideoModal />
        <AuthModal />
        <UserProfileModal />
      </div>
    </PullToRefresh>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </ErrorBoundary>
  );
}
