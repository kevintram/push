import * as stylex from '@stylexjs/stylex'

import { Button } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, radii } from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import { RatingMenu } from './RatingMenu'
import { getRating, todoRating } from './reviewRatings'

const styles = stylex.create({
	ratingBadge: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: colorsSemantic.surfaceInteractiveInverse,
		blockSize: iconSizes.sm,
		color: colorsSemantic.textOnInverse,
		display: 'flex',
		flexShrink: 0,
		inlineSize: iconSizes.sm,
		justifyContent: 'center',
	},
})

type RatingPickerProps = {
	onSetRating: (rating: Rating | null) => void
	rating: Rating | undefined
}

export function RatingPicker({ onSetRating, rating }: RatingPickerProps) {
	const current = getRating(rating)
	const RatingIcon = current?.Icon ?? todoRating.Icon

	return (
		<RatingMenu
			onSetRating={onSetRating}
			rating={rating}
			trigger={
				<Button iconOnly shape='round' size='micro' variant='ghost' />
			}
		>
			{!rating ? (
				<RatingIcon aria-hidden='true' size={iconSizes.sm} />
			) : (
				<span {...stylex.props(styles.ratingBadge)}>
					<RatingIcon aria-hidden='true' size={iconSizes.xs} />
				</span>
			)}
		</RatingMenu>
	)
}
