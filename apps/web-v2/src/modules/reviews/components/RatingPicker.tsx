import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { Circle } from 'lucide-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { reviewColors } from '~/styles/colors/components.stylex'
import { iconSizes, radii } from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import { getRating, ratings } from './reviewRatings'

const styles = stylex.create({
	ratingBadge: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: reviewColors.ratingBadgeBackground,
		blockSize: iconSizes.md,
		color: reviewColors.ratingBadgeForeground,
		display: 'flex',
		flexShrink: 0,
		inlineSize: iconSizes.md,
		justifyContent: 'center',
	},
})

type RatingPickerProps = {
	onSetRating: (rating: Rating | null) => void
	rating: Rating | undefined
	xstyle?: StyleXStyles
}

export function RatingPicker({
	onSetRating,
	rating,
	xstyle,
}: RatingPickerProps) {
	const current = getRating(rating)
	const RatingIcon = current?.Icon ?? Circle

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={current?.label ?? 'Uncompleted'}
				render={
					<Button.Icon
						shape='round'
						size='micro'
						variant='ghost'
						xstyle={xstyle}
					/>
				}
			>
				{!rating ? (
					<RatingIcon aria-hidden='true' size={iconSizes.md} />
				) : (
					<span {...stylex.props(styles.ratingBadge)}>
						<RatingIcon aria-hidden='true' size={iconSizes.sm} />
					</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuRadioGroup
					value={rating ?? ''}
					onValueChange={value =>
						onSetRating(value === '' ? null : (value as Rating))
					}
				>
					<DropdownMenuRadioItem
						value=''
						prefix={
							<Circle aria-hidden='true' size={iconSizes.md} />
						}
					>
						Uncompleted
					</DropdownMenuRadioItem>
					{Object.entries(ratings).map(([value, { label, Icon }]) => (
						<DropdownMenuRadioItem
							key={value}
							value={value}
							prefix={
								<Icon aria-hidden='true' size={iconSizes.md} />
							}
						>
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
