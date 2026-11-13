/** The ELITE wordmark as inline SVG; takes the current text colour. */
export default function EliteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 248 52" className={className} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <rect x="0" y="0" width="52" height="13" /><rect x="0" y="19.5" width="52" height="13" /><rect x="0" y="39" width="52" height="13" />
        <rect x="70" y="0" width="13" height="52" /><rect x="58" y="39" width="52" height="13" />
        <rect x="116" y="0" width="13" height="52" />
        <rect x="136" y="0" width="53" height="13" /><rect x="159" y="0" width="13" height="52" />
        <rect x="196" y="0" width="52" height="13" /><rect x="196" y="19.5" width="52" height="13" /><rect x="196" y="39" width="52" height="13" />
      </g>
    </svg>
  );
}
