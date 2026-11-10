import { useRef } from 'react';
import { I18nProvider } from './i18n/I18nProvider';
import { useRoute } from './hooks/useRoute';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import NewsSection from './components/NewsSection';
import NewsPage from './components/NewsPage';
import GamesSection from './components/GamesSection';
import GamePage from './components/GamePage';
import TournamentPage from './components/TournamentPage';
import BracketStudio, { PublicView } from './components/BracketStudio';
import BracketLive from './components/BracketLive';
import TournamentsSection from './components/TournamentsSection';
import ChampionsSection from './components/ChampionsSection';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import AdminPage from './components/AdminPage';
import SupportSection from './components/SupportSection';

function Pages() {
  const route = useRoute();
  const firstKey = useRef(route.key); // the page the visitor landed on does not fade (the loader already covers it)
  if (route.page === 'admin') return <AdminPage />;
  if (route.page === 'view') return <PublicView key={route.key} id={route.id!} />;
  if (route.page === 'live') return <BracketLive id={route.id!} />;
  if (route.page === 'bracket') return <div key={route.key.startsWith('bracket:') ? 'studio' : route.key} className="st-root"><BracketStudio id={route.id} /></div>;
  return (
    <>
      <Header page={route.page} />
      <main key={route.key} className={route.key === firstKey.current ? undefined : 'route-fade'}>
        {route.page === 'news' ? (
          <NewsPage />
        ) : route.page === 'game' ? (
          <GamePage id={route.id ?? ''} />
        ) : route.page === 'tournament' ? (
          <TournamentPage id={route.id ?? ''} />
        ) : (
          <>
            <HeroSection />
            <NewsSection />
            <GamesSection />
            <TournamentsSection />
            <ChampionsSection />
            {/* <SupportSection /> */}
          </>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Pages />
    </I18nProvider>
  );
}
