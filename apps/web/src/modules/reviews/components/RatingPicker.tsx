import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { Circle } from 'lucide-react'
import { useState } from 'react'

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
	/** Controls whether the menu is open; it manages itself when omitted. */
	open?: boolean
	onOpenChange?: (open: boolean) => void
	onSetRating: (rating: Rating | null) => void
	rating: Rating | undefined
	ref?: React.Ref<HTMLButtonElement>
	xstyle?: StyleXStyles
}

export function RatingPicker({
	disabled = false,
	open,
	onOpenChange,
	onSetRating,
	rating,
	ref,
	xstyle,
}: RatingPickerProps) {
	const current = getRating(rating)
	const RatingIcon = current?.Icon ?? Circle
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
	const isOpen = open ?? uncontrolledOpen
	const setIsOpen = (next: boolean) => {
		setUncontrolledOpen(next)
		onOpenChange?.(next)
	}
	// State, not a ref, so the keys register once the menu mounts.
	const [menu, setMenu] = useState<HTMLDivElement | null>(null)

	const pick = (next: Rating | null) => {
		if (next !== (rating ?? null)) onSetRating(next)
		setIsOpen(false)
	}

	// While the menu is open, each rating's key picks it, like a click. The
	// keys belong to the open menu, so they register nothing while it's
	// closed.
	useHotkeys(
		[
			{ hotkey: appHotkeys.rateUncompleted, callback: () => pick(null) },
			...Object.entries(ratings).map(([value, { hotkey }]) => ({
				hotkey,
				callback: () => pick(value as Rating),
			})),
		],
		{ target: menu },
	)

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
			<DropdownMenuContent ref={setMenu}>
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
						{...hotkeyItemProps(appHotkeys.rateUncompleted)}
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
								{...hotkeyItemProps(hotkey)}
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
