/** Plain text → paragraph + bullet list. A line (or inline " - ") starting with -, • or * becomes a bullet. */
function parse(text: string): { intro: string[]; items: string[]; outro: string[] } {
  const intro: string[] = [], items: string[] = [], outro: string[] = [];
  for (const line of text.replace(/\r/g, '').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const parts = t.split(/(?:^|\s)[-•*]\s+/); // "intro: - a - b"  →  ["intro:", "a", "b"]
    const startsBullet = /^[-•*]\s+/.test(t);
    const first = startsBullet ? '' : parts[0];
    const rest = startsBullet ? parts.slice(1) : parts.slice(1);
    if (first.trim()) (items.length ? outro : intro).push(first.trim());
    for (const r of rest) if (r.trim()) items.push(r.trim());
  }
  return { intro, items, outro };
}

export default function RichText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const { intro, items, outro } = parse(text);
  return (
    <div className={className} style={style}>
      {intro.map((p, i) => <p key={i}>{p}</p>)}
      {items.length > 0 && (
        <ul className="rt-list">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
      )}
      {outro.map((p, i) => <p key={`o${i}`} style={{ marginTop: '.5rem' }}>{p}</p>)}
    </div>
  );
}
