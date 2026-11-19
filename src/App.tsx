import { useEffect, useRef } from 'react';
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
import JoinPage from './components/JoinPage';
import TournamentsSection from './components/TournamentsSection';
import LeaderboardSection from './components/LeaderboardSection';
import { SHOW_LEADERBOARD } from './config/site';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import AdminPage from './components/AdminPage';
import SupportSection from './components/SupportSection';

function Pages() {
  const route = useRoute();
  const firstKey = useRef(route.key); // the page the visitor landed on does not fade (the loader already covers it)
  // visit counter for the dashboard: one tiny call per page shown (n=1 on the first page of a browser session); never from the dashboard itself
  useEffect(() => {
    if (route.page === 'admin') return;
    let first = 1; try { first = sessionStorage.getItem('plato-visit') ? 0 : 1; sessionStorage.setItem('plato-visit', '1'); } catch { /* private mode */ }
    void fetch('/api/hit', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ n: first }) }).catch(() => undefined);
  }, [route.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (route.page === 'admin') return <AdminPage />;
  if (route.page === 'view') return <PublicView key={route.key} id={route.id!} />;
  if (route.page === 'join') return <JoinPage key={route.key} id={route.id!} />;
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
            {SHOW_LEADERBOARD && <LeaderboardSection />}
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
