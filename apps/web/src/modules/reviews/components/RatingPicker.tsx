import * as stylex from '@stylexjs/stylex'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useState } from 'react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui'
import { hotkeyItemProps } from '~/modules/shortcuts/hotkeyItemProps'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, radii } from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import {
	getRating,
	ratingChoices,
	ratingFromChoice,
	TODO_VALUE,
	todoRating,
} from './reviewRatings'

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
	const [isOpen, setIsOpen] = useState(false)
	// State, not a ref, so the keys register once the menu mounts.
	const [menu, setMenu] = useState<HTMLDivElement | null>(null)

	const value = rating ?? TODO_VALUE
	const pick = (next: string) => {
		if (next !== value) onSetRating(ratingFromChoice(next))
		setIsOpen(false)
	}

	// While the menu is open, each rating's key picks it, like a click. The
	// keys belong to the open menu, so they register nothing while it's
	// closed.
	useHotkeys(
		ratingChoices.map(choice => ({
			hotkey: choice.hotkey,
			callback: () => pick(choice.value),
		})),
		{ target: menu },
	)

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger
				aria-label={current?.label ?? todoRating.label}
				render={
					<Button
						iconOnly
						shape='round'
						size='micro'
						variant='ghost'
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
			<DropdownMenuContent ref={setMenu}>
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={next => pick(next as string)}
				>
					{ratingChoices.map(({ value, label, Icon, hotkey }) => [
						value === TODO_VALUE && (
							<DropdownMenuSeparator key='separator' />
						),
						<DropdownMenuRadioItem
							key={value}
							closeOnClick
							value={value}
							prefix={
								<Icon aria-hidden='true' size={iconSizes.sm} />
							}
							{...hotkeyItemProps(hotkey)}
						>
							{label}
						</DropdownMenuRadioItem>,
					])}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
