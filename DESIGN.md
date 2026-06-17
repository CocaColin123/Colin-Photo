# Design System Notes

## Aesthetic Direction

Refined nocturnal photo archive. The site should feel like a dark viewing room with a few lit surfaces: a large print, a strip of film, a quiet caption, a diary page. The memorable object is not a card or a gradient, but the feeling of photographs being handled, sequenced, and viewed.

## Color

- Base: near-black with a cool photographic tint, not pure black.
- Surface: translucent dark neutrals only when they serve readability.
- Accent: album-specific colors may remain, but use them as captions, rules, and subtle state, not large decorative fills.
- Text: off-white and muted gray-green/blue grays. Avoid pure white except for sharp focus points.

## Typography

- Keep the existing Chinese font identities for album titles.
- Use large serif display type sparingly for the landing statement and chapter titles.
- Body and diary text should favor calm line length, generous line height, and readable contrast.
- Tracked micro-labels are acceptable for metadata, but do not use all-caps styling for long text.

## Layout

- Landing: one dominant photographic field, one strong text block, one secondary object such as a light-table preview or film fragment.
- Works: asymmetrical chapter list with less vertical waste than a gallery installation, enough rhythm to show multiple albums during normal scrolling.
- Album: left-side chapter context plus right-side photography. Prefer a chapter cover or lead image before a dense grid.
- Journal: diary entries should read like pages from a notebook inside the same dark archive, with dates and optional photo pairings.
- About: one focused portrait/trace of the author, one short statement, contact paths.

## Interaction

- Album cards: whole surface is clickable, with visible hover/focus feedback.
- Lightbox: keyboard arrows, Escape close, swipe/drag, and large left/right hot zones.
- Guidance should be non-blocking unless there is a real modal task.
- Music and custom cursor should be atmospheric, never primary controls.

## Motion

- Use slow fade/slide reveals and subtle hover lift.
- Avoid bouncy or elastic motion.
- Avoid animating layout properties where transform and opacity are enough.
- Motion should make the archive feel alive, not busy.

## Image Treatment

- Favor real photography over generated or decorative visuals.
- Avoid cropping that hides the subject unless the crop is clearly editorial.
- Keep overlays sparse. Use the "poetic" mode as an optional layer, not the default barrier to viewing.

## Future Blog / Journal Direction

The diary feature should be called Journal or Notes rather than Blog in the visual language, even if the route can be `/blog`. It should support personal dated entries, short essays, and images. It should not require tags, categories, comments, or a CMS until the writing volume demands it.
