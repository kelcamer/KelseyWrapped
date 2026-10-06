/* Grapheme-colour map — the Fisher-Price alphabet magnets.
   ------------------------------------------------------------------
   Copied from SpecialInterests/src/data/synesthesia.js (via MagnetWords) so this page and
   the index title colour every letter identically. Change one, change
   both.

   The magnets (sold 1971-1990) run the rainbow minus indigo, cycling
   from A:

       red · orange · yellow · green · blue · purple

   So A is red, B orange, C yellow, D green, E blue, F purple, and G
   starts over. Witthoft, Winawer & Eagleman (2015, PLoS ONE
   10(3):e0118996, PMID 25739095) found >6% of 6,588 American
   synesthetes learned many of their letter colours from this toy, about
   15% of those born 1975-1980; their note that G and Y are red in the toy is what fixes the
   cycle's phase.

   The colour belongs to the letter, never to its position: every "e" is
   the same blue wherever it sits in a word. */
export const LETTER_HUE = {
  a: "red",    b: "orange", c: "yellow", d: "green",  e: "blue",   f: "purple",
  g: "red",    h: "orange", i: "yellow", j: "green",  k: "blue",   l: "purple",
  m: "red",    n: "orange", o: "yellow", p: "green",  q: "blue",   r: "purple",
  s: "red",    t: "orange", u: "yellow", v: "green",  w: "blue",   x: "purple",
  y: "red",    z: "orange",
};

export const HUES = ["red", "orange", "yellow", "green", "blue", "purple"];

/* Accented letters take their base letter's colour (é is an e), since the
   accent is a mark on the letter, not a different one. Anything outside
   A-Z — digits, punctuation, other scripts — has no magnet and gets null. */
export function baseLetter(ch) {
  const b = ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return b.length === 1 && LETTER_HUE[b] ? b : null;
}

export function hueFor(ch) {
  const b = baseLetter(ch);
  return b ? LETTER_HUE[b] : null;
}
