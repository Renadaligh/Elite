import { useRef, useState } from 'react';

/** Undo / redo for the bracket editors: remembers the last edits (not the typing in other fields). */
export function useBracketHistory<T>() {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, tick] = useState(0);
  const bump = () => tick((n) => n + 1);
  return {
    /** call with the value BEFORE a new edit */
    record(cur: T) { past.current.push(cur); if (past.current.length > 60) past.current.shift(); future.current = []; bump(); },
    undo(cur: T): T | undefined { const p = past.current.pop(); if (p === undefined) return undefined; future.current.push(cur); bump(); return p; },
    redo(cur: T): T | undefined { const n = future.current.pop(); if (n === undefined) return undefined; past.current.push(cur); bump(); return n; },
    clear() { past.current = []; future.current = []; bump(); },
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
