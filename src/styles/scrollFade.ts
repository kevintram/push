import * as stylex from '@stylexjs/stylex'

import { scrollFadeVars } from './scrollFade.stylex'

const SCROLL_TIMELINES = '@supports (animation-timeline: scroll())'

// The animated depths. `global.css` registers both as non-inherited lengths so
// the keyframes interpolate them and a change restyles only the container.
// Typed as `string` because StyleX's keyframes type rejects literal custom
// property keys; the compiler accepts them.
const TOP: string = '--scroll-fade-top'
const BOTTOM: string = '--scroll-fade-bottom'

// StyleX only compiles these when they sit beside the `stylex.create` that
// uses them, so they can't move into `scrollFade.stylex.ts`.
const revealTop = stylex.keyframes({
	from: { [TOP]: '0px' },
	to: { [TOP]: scrollFadeVars.size },
})

const hideBottom = stylex.keyframes({
	from: { [BOTTOM]: scrollFadeVars.size },
	to: { [BOTTOM]: '0px' },
})

/**
 * Fades the edges of a scroll container only where more content is hidden:
 * the top edge fades in as you scroll away from the start, and the bottom
 * edge fades out as you reach the end. Apply it to the element with
 * `overflowY: 'auto'`.
 *
 * The fade depths are driven by a CSS scroll-driven animation, so there is no
 * scroll listener. The style owns `animation-*` on the element, so don't
 * combine it with another animation there.
 *
 * Browsers without scroll timelines get no fade. A static fade there would
 * cover the last row even after scrolling to the end.
 *
 * A container that doesn't overflow has an inactive scroll timeline, so the
 * animation doesn't run and both depths stay at their registered initial value
 * of 0px: no fade.
 */
export const scrollFade = stylex.create({
	y: {
		// The StyleX lint plugin's property list predates `animation-range`;
		// the compiler accepts it.
		// oxlint-disable-next-line @stylexjs/valid-styles
		animationRange: `0 ${scrollFadeVars.reveal}, calc(100% - ${scrollFadeVars.reveal}) 100%`,
		animationDuration: '1ms',
		animationFillMode: 'both',
		animationName: {
			[SCROLL_TIMELINES]: `${revealTop}, ${hideBottom}`,
			default: 'none',
		},
		animationTimeline: 'scroll(self y), scroll(self y)',
		animationTimingFunction: 'linear',
		maskImage: {
			[SCROLL_TIMELINES]: `linear-gradient(to bottom, transparent 0, black var(${TOP}), black calc(100% - var(${BOTTOM})), transparent 100%)`,
			default: 'none',
		},
	},
})
