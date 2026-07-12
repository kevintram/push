import * as stylex from '@stylexjs/stylex'
import {
	ChevronDown,
	CreditCard,
	LogOut,
	Settings,
	Star,
	User,
} from 'lucide-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from '~/components/ui'
import { colors, fontSizes, spacing } from '~/styles/tokens.stylex'

import { SpecimenSection } from './SpecimenSection'

const buttonVariants = ['default', 'secondary', 'outline', 'ghost'] as const
const buttonSizes = ['sm', 'default', 'lg', 'icon'] as const

const styles = stylex.create({
	rowGrid: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr',
			'@media (min-width: 640px)': 'minmax(112px, max-content) 1fr',
		},
	},
	rowLabel: {
		color: colors.mutedForeground,
		fontSize: fontSizes.xs,

		paddingBlock: {
			default: spacing.lg,
			'@media (min-width: 640px)': spacing.none,
		},

		alignSelf: {
			default: 'auto',
			'@media (min-width: 640px)': 'center',
		},
		paddingInlineStart: spacing.xl,
	},
	rowButtons: {
		gap: spacing.md,

		alignItems: 'center',
		display: 'flex',
		flexWrap: 'wrap',

		paddingBlock: {
			default: spacing.lg,
			'@media (min-width: 640px)': spacing.xl,
		},
		paddingInline: spacing.xl,
	},
})

export function ComponentSection() {
	return (
		<>
			<SpecimenSection
				id='components'
				title='Button'
				meta={`${buttonVariants.length} variants · ${buttonSizes.length} sizes`}
			>
				<div>
					{buttonVariants.map(variant => (
						<div key={variant} {...stylex.props(styles.rowGrid)}>
							<span {...stylex.props(styles.rowLabel)}>
								{variant}
							</span>
							<div {...stylex.props(styles.rowButtons)}>
								{buttonSizes.map(size => (
									<Button
										key={size}
										size={size}
										variant={variant}
									>
										{size === 'icon' ? (
											<Star size={16} />
										) : (
											size
										)}
									</Button>
								))}
								<Button disabled variant={variant}>
									disabled
								</Button>
							</div>
						</div>
					))}
				</div>
			</SpecimenSection>
			<SpecimenSection
				id='dropdown-menu'
				title='Dropdown menu'
				meta='Base UI · compound API'
			>
				<div {...stylex.props(styles.rowButtons)}>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={<Button variant='outline' />}
						>
							My account
							<ChevronDown aria-hidden size={16} />
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									My account
								</DropdownMenuLabel>
								<DropdownMenuItem>
									<User aria-hidden size={16} /> Profile
									<DropdownMenuShortcut>
										⇧⌘P
									</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<CreditCard aria-hidden size={16} /> Billing
								</DropdownMenuItem>
								<DropdownMenuItem disabled>
									<Settings aria-hidden size={16} /> Settings
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant='destructive'>
								<LogOut aria-hidden size={16} /> Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</SpecimenSection>
		</>
	)
}
