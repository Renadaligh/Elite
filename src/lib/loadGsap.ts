/** gsap + ScrollTrigger are loaded on demand (one shared promise), so they stay out of the first bundle that the home page needs to paint. */
type Lib = { gsap: typeof import('gsap').gsap; ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger };
let p: Promise<Lib> | null = null;
export const loadGsap = (): Promise<Lib> => (p ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, s]) => {
  g.gsap.registerPlugin(s.ScrollTrigger);
  return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
}).catch((e) => { p = null; throw e; }));
