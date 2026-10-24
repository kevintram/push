import * as stylex from '@stylexjs/stylex'

import type { ButtonSize } from '~/components/ui'
import { fontSizes } from '~/styles/tokens.stylex'

import type { Review } from '../types/review.types'
import { StrengthSignal } from './StrengthSignal'

const sizeVariants = stylex.create({
	micro: { fontSize: fontSizes.sm },
	tiny: { fontSize: fontSizes.sm },
	small: { fontSize: fontSizes.md },
	medium: { fontSize: fontSizes.md },
	large: { fontSize: fontSizes.md },
})

type ReviewStrengthProps = {
	review: Review
	size?: ButtonSize
}

export function ReviewStrength({
	review,
	size = 'medium',
}: ReviewStrengthProps) {
	return (
		<StrengthSignal
			stability={review.stabilityAfter ?? null}
			stabilityBefore={review.stabilityBefore ?? null}
			xstyle={sizeVariants[size]}
		/>
	)
}
