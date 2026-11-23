import { useSyncExternalStore } from 'react';

/** The open tournament tells the dashboard's side menu which sections it has (and which is shown), so the menu can list them instead of the dashboard links. */
export interface SecDef { k: string; label: string }
export interface SectionNav { tabs: SecDef[]; active: string; pick: (k: string) => void; back?: () => void; backLabel?: string }
const none: SectionNav = { tabs: [], active: '', pick: () => undefined };
let state: SectionNav = none;
const subs = new Set<() => void>();
export const setSectionNav = (n: SectionNav) => { state = n; subs.forEach((f) => f()); };
export const clearSectionNav = () => setSectionNav(none);
export const useSectionNav = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state);
