import { Suspense, useEffect, useRef } from 'react';
import { lazyPage } from './lazyPage';
import { I18nProvider } from './i18n/I18nProvider';
import { useRoute } from './hooks/useRoute';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import NewsSection from './components/NewsSection';
const NewsPage = lazyPage(() => import('./components/NewsPage'));
import GamesSection from './components/GamesSection';
const TournamentsPage = lazyPage(() => import('./components/TournamentsPage'));
const GamePage = lazyPage(() => import('./components/GamePage'));
const TournamentPage = lazyPage(() => import('./components/TournamentPage'));
const BracketStudio = lazyPage(() => import('./components/BracketStudio'));
const PublicView = lazyPage(() => import('./components/BracketStudio').then((m) => ({ default: m.PublicView })));
const JoinPage = lazyPage(() => import('./components/JoinPage'));
import TournamentsSection from './components/TournamentsSection';
import LeaderboardSection from './components/LeaderboardSection';
import { SHOW_LEADERBOARD } from './config/site';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
const AdminPage = lazyPage(() => import('./components/AdminPage'));
import SupportSection from './components/SupportSection';

const Wait = () => <div style={{ minHeight: '100vh' }} aria-busy="true" />;

function Pages() {
  const route = useRoute();
  const firstKey = useRef(route.key); // the page the visitor landed on does not fade (the loader already covers it)
  // visit counter for the dashboard: one tiny call per page shown (n=1 on the first page of a browser session); never from the dashboard itself
  useEffect(() => {
    if (route.page === 'admin') return;
    let first = 1; try { first = sessionStorage.getItem('plato-visit') ? 0 : 1; sessionStorage.setItem('plato-visit', '1'); } catch { /* private mode */ }
    void fetch('/api/hit', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ n: first }) }).catch(() => undefined);
  }, [route.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (route.page === 'admin') return <Suspense fallback={<Wait />}><AdminPage /></Suspense>;
  if (route.page === 'view') return <Suspense fallback={<Wait />}><PublicView key={route.key} id={route.id!} /></Suspense>;
  if (route.page === 'join') return <Suspense fallback={<Wait />}><JoinPage key={route.key} id={route.id!} /></Suspense>;
  if (route.page === 'bracket') return <div key={route.key.startsWith('bracket:') ? 'studio' : route.key} className="st-root"><Suspense fallback={<Wait />}><BracketStudio id={route.id} /></Suspense></div>;
  return (
    <>
      <Header page={route.page} />
      <main key={route.key} className={route.key === firstKey.current ? undefined : 'route-fade'}>
        {route.page === 'news' ? (
          <Suspense fallback={<Wait />}><NewsPage /></Suspense>
        ) : route.page === 'tournaments' ? (
          <Suspense fallback={<Wait />}><TournamentsPage /></Suspense>
        ) : route.page === 'game' ? (
          <Suspense fallback={<Wait />}><GamePage id={route.id ?? ''} /></Suspense>
        ) : route.page === 'tournament' ? (
          <Suspense fallback={<Wait />}><TournamentPage id={route.id ?? ''} /></Suspense>
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
