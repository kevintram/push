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
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { iconSizes, radii } from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import { getRating, ratings } from './reviewRatings'

const styles = stylex.create({
	ratingBadge: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: semanticColors.surfaceInteractivePrimary,
		blockSize: iconSizes.sm,
		color: semanticColors.textOnBrand,
		display: 'flex',
		flexShrink: 0,
		inlineSize: iconSizes.sm,
		justifyContent: 'center',
	},
})

type RatingPickerProps = {
	disabled?: boolean
	onSetRating: (rating: Rating | null) => void
	rating: Rating | undefined
	xstyle?: StyleXStyles
}

export function RatingPicker({
	disabled = false,
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
					<Button
						iconOnly
						shape='round'
						size='micro'
						disabled={disabled}
						variant='ghost'
						xstyle={xstyle}
					/>
				}
			>
				{!rating ? (
					<RatingIcon aria-hidden='true' size={iconSizes.sm} />
				) : (
					<span {...stylex.props(styles.ratingBadge)}>
						<RatingIcon aria-hidden='true' size={iconSizes.xs} />
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
						closeOnClick
						value=''
						prefix={
							<Circle aria-hidden='true' size={iconSizes.sm} />
						}
					>
						Uncompleted
					</DropdownMenuRadioItem>
					{Object.entries(ratings).map(([value, { label, Icon }]) => (
						<DropdownMenuRadioItem
							key={value}
							closeOnClick
							value={value}
							prefix={
								<Icon aria-hidden='true' size={iconSizes.sm} />
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
