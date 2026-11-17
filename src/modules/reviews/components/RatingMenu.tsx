import { useHotkeys } from '@tanstack/react-hotkeys'
import { useState } from 'react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { hotkeyItemProps } from '~/modules/shortcuts/hotkeyItemProps'
import { iconSizes } from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import { getRating, ratingChoices, unrated } from './reviewRatings'

type RatingMenuProps = {
	/** The trigger's content. */
	children: React.ReactNode
	disabled?: boolean
	onSetRating: (rating: Rating) => void
	rating: Rating | undefined
	/** The trigger element, which receives `children`. */
	trigger: React.ReactElement
}

/**
 * Every rating choice as a menu. While the menu is open, each choice's key
 * picks it, like a click.
 */
export function RatingMenu({
	children,
	disabled = false,
	onSetRating,
	rating,
	trigger,
}: RatingMenuProps) {
	const [isOpen, setIsOpen] = useState(false)
	// State, not a ref, so the keys register once the menu mounts.
	const [menu, setMenu] = useState<HTMLDivElement | null>(null)

	const pick = (next: Rating) => {
		if (next !== rating) onSetRating(next)
		setIsOpen(false)
	}

	// The keys belong to the open menu, so they register nothing while it's
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
				aria-label={(getRating(rating) ?? unrated).label}
				disabled={disabled}
				render={trigger}
			>
				{children}
			</DropdownMenuTrigger>
			<DropdownMenuContent ref={setMenu}>
				<DropdownMenuRadioGroup
					// An unrated review matches no choice, so none is checked.
					value={rating ?? ''}
					onValueChange={next => pick(next as Rating)}
				>
					{ratingChoices.map(({ value, label, Icon, hotkey }) => (
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
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
