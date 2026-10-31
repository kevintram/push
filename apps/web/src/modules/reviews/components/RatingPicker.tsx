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
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { hotkeyItemProps } from '~/modules/shortcuts/hotkeyItemProps'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, radii } from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import { getRating, ratings } from './reviewRatings'

const styles = stylex.create({
	ratingBadge: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: colorsSemantic.surfaceInteractivePrimary,
		blockSize: iconSizes.sm,
		color: colorsSemantic.textOnBrand,
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
	ref?: React.Ref<HTMLButtonElement>
	/**
	 * Shows each rating's `0`–`4` key. Only the review composer handles those
	 * keys, so other pickers leave this off.
	 */
	showShortcuts?: boolean
	xstyle?: StyleXStyles
}

export function RatingPicker({
	disabled = false,
	onSetRating,
	rating,
	ref,
	showShortcuts = false,
	xstyle,
}: RatingPickerProps) {
	const current = getRating(rating)
	const RatingIcon = current?.Icon ?? Circle

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={current?.label ?? 'Uncompleted'}
				ref={ref}
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
						{...(showShortcuts
							? hotkeyItemProps(appHotkeys.rateUncompleted)
							: {})}
					>
						Uncompleted
					</DropdownMenuRadioItem>
					{Object.entries(ratings).map(
						([value, { label, Icon, hotkey }]) => (
							<DropdownMenuRadioItem
								key={value}
								closeOnClick
								value={value}
								prefix={
									<Icon
										aria-hidden='true'
										size={iconSizes.sm}
									/>
								}
								{...(showShortcuts
									? hotkeyItemProps(hotkey)
									: {})}
							>
								{label}
							</DropdownMenuRadioItem>
						),
					)}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
