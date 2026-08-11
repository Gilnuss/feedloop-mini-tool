/**
 * The "what is this" line above the demo.
 *
 * Two jobs, in one short block: say who FeedLoop is, and make clear that this
 * page is a free sample of it rather than the product itself. A visitor landing
 * from a shared link has neither piece of context, and without them the
 * textarea reads as a demand before it reads as an offer.
 *
 * ⚠️ LENGTH IS THE CONSTRAINT, not the copy. Everything here sits above a 192px
 * textarea and the primary button; on a small phone the button is already close
 * to the fold, and a CTA you have to scroll for is the exact leak this page
 * cannot afford. MISSION_DETAIL is hidden below the `sm` breakpoint for that
 * reason. If you lengthen either string, check a 390px viewport before shipping.
 */

/** Always visible. Must survive being the only sentence a visitor reads. */
export const MISSION_HEADLINE =
  "FeedLoop turns scattered user feedback into developer-ready tickets.";

/** Desktop only — see the length note above. */
export const MISSION_DETAIL =
  "This is a free sample of it: one batch, no signup, results in seconds.";
