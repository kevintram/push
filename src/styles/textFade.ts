import * as stylex from '@stylexjs/stylex'

import { textFadeVars } from './textFade.stylex'

/**
 * Keeps text on one line and, like claude.ai's sidebar, fades out text that
 * overflows instead of ending it in an ellipsis. Apply it to a span around the
 * text, not to an element with its own background or focus ring, since the
 * mask fades those too.
 *
 * The fade covers the span's end padding, which short text never reaches. The
 * span fills a flex row; in a container that sizes to its text, the padding
 * replaces the container's own, so drop that and set `textFadeVars.size` to it.
 */
export const textFade = stylex.create({
	line: {
		overflow: 'hidden',
		display: 'block',
		flexGrow: 1,
		maskImage: `linear-gradient(to right, black calc(100% - ${textFadeVars.size} - ${textFadeVars.inset}), transparent calc(100% - ${textFadeVars.inset}))`,
		minInlineSize: 0,
		paddingInlineEnd: textFadeVars.size,
		whiteSpace: 'nowrap',
	},
})
