/** Shared limits. The host's own upload budget may be tighter; a retouch never exceeds this. */
export const MAX_EDGE = 2048;

/** Default preview long edge: sharp at a card's width, cheap enough to repaint per slider tick. */
export const PREVIEW_EDGE = 900;
