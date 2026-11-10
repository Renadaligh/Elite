import { useEffect, useState } from 'react';
import type { Bracket } from '../data/bracket';
import { api } from '../services/api';
import BracketView from './BracketView';

/** Stream overlay (#/bracket/<id>/live): transparent background, refreshes itself, for OBS "Browser Source". Only works while the owner has the stream link switched on. */
export default function BracketLive({ id }: { id: string }) {
  const [data, setData] = useState<{ title: string; bracket: Bracket } | null>(null);
  useEffect(() => {
    document.documentElement.classList.add('st-livepage');
    return () => document.documentElement.classList.remove('st-livepage');
  }, []);
  useEffect(() => {
    let dead = false;
    const pull = () => api<{ title: string; bracket: Bracket | null }>(`/brackets/${id}?live=1`)
      .then((r) => { if (!dead) setData(r.bracket ? { title: r.title, bracket: r.bracket } : null); })
      .catch(() => { if (!dead) setData(null); });
    pull();
    const t = window.setInterval(pull, 5000);
    return () => { dead = true; window.clearInterval(t); };
  }, [id]);
  if (!data) return <div className="st-livebox" />;
  return (
    <div className="st-livebox">
      <h1 className="st-livet">{data.title}</h1>
      <BracketView bracket={data.bracket} />
    </div>
  );
}
