import * as stylex from '@stylexjs/stylex'
import {
	ChevronDown,
	Copy,
	CreditCard,
	FilePenLine,
	LogOut,
	Monitor,
	Moon,
	Settings,
	Star,
	Sun,
	Trash2,
	User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { neutral } from '~/styles/colors/primitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import {
	breakpoints,
	fontSizes,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { SpecimenSection } from './SpecimenSection'

const buttonVariants = [
	'primary',
	'secondary',
	'outline',
	'ghost',
	'danger',
] as const
const buttonSizes = ['micro', 'tiny', 'small', 'medium', 'large'] as const

const styles = stylex.create({
	rowGrid: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr',
			[breakpoints.tablet]: 'minmax(112px, max-content) 1fr',
		},
	},
	rowLabel: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.xs,

		paddingBlock: {
			default: spacing.lg,
			[breakpoints.tablet]: spacing.none,
		},

		alignSelf: {
			default: 'auto',
			[breakpoints.tablet]: 'center',
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
			[breakpoints.tablet]: spacing.xl,
		},
		paddingInline: spacing.xl,
	},
	fieldGrid: {
		columnGap: spacing.xl,
		rowGap: spacing.xl,

		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			[breakpoints.tablet]: 'repeat(2, minmax(0, 1fr))',
		},

		paddingBlock: spacing.xl,
		paddingInline: spacing.xl,
	},
	field: {
		gap: spacing.sm,

		display: 'flex',
		flexDirection: 'column',
		minWidth: 0,
	},
	fieldLabel: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.xs,
	},
	contextMenuTrigger: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		borderColor: { [DARK]: neutral.s600, default: neutral.s300 },
		borderRadius: radii.xs,
		borderStyle: 'dashed',
		borderWidth: '1px',
		color: { [DARK]: neutral.s400, default: neutral.s600 },

		blockSize: '8rem',
		inlineSize: '16rem',
	},
})

export function ComponentSection() {
	const [notificationsEnabled, setNotificationsEnabled] = useState(true)
	const [theme, setTheme] = useState('system')

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
										{size}
									</Button>
								))}
							</div>
						</div>
					))}
					<div {...stylex.props(styles.rowGrid)}>
						<span {...stylex.props(styles.rowLabel)}>shapes</span>
						<div {...stylex.props(styles.rowButtons)}>
							<Button shape='square'>Square</Button>
							<Button shape='round'>Round</Button>
							<Button variant='danger' shape='round'>
								Danger round
							</Button>
							<Button shape='round' variant='outline'>
								<Star aria-hidden size={iconSizes.sm} />
								Icon + label
							</Button>
						</div>
					</div>
					<div {...stylex.props(styles.rowGrid)}>
						<span {...stylex.props(styles.rowLabel)}>
							icon only
						</span>
						<div {...stylex.props(styles.rowButtons)}>
							{buttonSizes.map(size => (
								<Button
									aria-label={`${size} favorite`}
									iconOnly
									key={size}
									shape='round'
									size={size}
									variant='outline'
								>
									<Star aria-hidden size={iconSizes.sm} />
								</Button>
							))}
						</div>
					</div>
					{buttonVariants.map(variant => (
						<div key={variant} {...stylex.props(styles.rowGrid)}>
							<span {...stylex.props(styles.rowLabel)}>
								{variant} · disabled
							</span>
							<div {...stylex.props(styles.rowButtons)}>
								{buttonSizes.map(size => (
									<Button
										disabled
										key={size}
										size={size}
										variant={variant}
									>
										{variant}
									</Button>
								))}
							</div>
						</div>
					))}
				</div>
			</SpecimenSection>
			<SpecimenSection
				id='textarea'
				title='Textarea'
				meta='Default · invalid · disabled'
			>
				<div {...stylex.props(styles.fieldGrid)}>
					<label {...stylex.props(styles.field)}>
						<span {...stylex.props(styles.fieldLabel)}>
							Default
						</span>
						<Textarea placeholder='Add a note about this review…' />
					</label>
					<label {...stylex.props(styles.field)}>
						<span {...stylex.props(styles.fieldLabel)}>
							Invalid
						</span>
						<Textarea
							aria-invalid='true'
							defaultValue='This answer needs a little more detail.'
						/>
					</label>
					<label {...stylex.props(styles.field)}>
						<span {...stylex.props(styles.fieldLabel)}>
							Disabled
						</span>
						<Textarea
							disabled
							placeholder='Editing is unavailable'
						/>
					</label>
				</div>
			</SpecimenSection>
			<SpecimenSection
				id='dialog'
				title='Dialog'
				meta='Base UI · modal compound API'
			>
				<div {...stylex.props(styles.rowButtons)}>
					<Dialog>
						<DialogTrigger render={<Button variant='outline' />}>
							Open dialog
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Edit review</DialogTitle>
								<DialogDescription>
									Update the review details. Your changes will
									be saved to this card.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogClose
									render={<Button variant='outline' />}
								>
									Cancel
								</DialogClose>
								<DialogClose render={<Button />}>
									Save changes
								</DialogClose>
							</DialogFooter>
						</DialogContent>
					</Dialog>
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
							<ChevronDown aria-hidden size={iconSizes.sm} />
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									My account
								</DropdownMenuLabel>
								<DropdownMenuItem>
									<User aria-hidden size={iconSizes.sm} />{' '}
									Profile
									<DropdownMenuShortcut>
										⇧⌘P
									</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<CreditCard
										aria-hidden
										size={iconSizes.sm}
									/>{' '}
									Billing
								</DropdownMenuItem>
								<DropdownMenuItem disabled>
									<Settings aria-hidden size={iconSizes.sm} />{' '}
									Settings
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuCheckboxItem
								checked={notificationsEnabled}
								onCheckedChange={setNotificationsEnabled}
							>
								Notifications
							</DropdownMenuCheckboxItem>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>
									Theme
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuGroup>
										<DropdownMenuLabel>
											Appearance
										</DropdownMenuLabel>
										<DropdownMenuRadioGroup
											value={theme}
											onValueChange={setTheme}
										>
											<DropdownMenuRadioItem value='light'>
												<Sun
													aria-hidden
													size={iconSizes.sm}
												/>{' '}
												Light
											</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value='dark'>
												<Moon
													aria-hidden
													size={iconSizes.sm}
												/>{' '}
												Dark
											</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value='system'>
												<Monitor
													aria-hidden
													size={iconSizes.sm}
												/>{' '}
												System
											</DropdownMenuRadioItem>
										</DropdownMenuRadioGroup>
									</DropdownMenuGroup>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<LogOut aria-hidden size={iconSizes.sm} /> Log
								out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</SpecimenSection>
			<SpecimenSection
				id='context-menu'
				title='Context menu'
				meta='Base UI · right click or long press'
			>
				<div {...stylex.props(styles.rowButtons)}>
					<ContextMenu>
						<ContextMenuTrigger
							{...stylex.props(styles.contextMenuTrigger)}
						>
							Right click here
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem>
								<FilePenLine aria-hidden size={iconSizes.sm} />{' '}
								Edit
								<ContextMenuShortcut>⌘E</ContextMenuShortcut>
							</ContextMenuItem>
							<ContextMenuItem>
								<Copy aria-hidden size={iconSizes.sm} />{' '}
								Duplicate
								<ContextMenuShortcut>⌘D</ContextMenuShortcut>
							</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem>
								<Trash2 aria-hidden size={iconSizes.sm} />{' '}
								Delete
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				</div>
			</SpecimenSection>
			<SpecimenSection
				id='toast'
				title='Toast'
				meta='Sonner · default · info · success · warning · error'
			>
				<div {...stylex.props(styles.rowButtons)}>
					<Button
						variant='outline'
						onClick={() => toast('Review saved')}
					>
						Default toast
					</Button>
					<Button
						variant='outline'
						onClick={() => toast.info('A new review is available')}
					>
						Info toast
					</Button>
					<Button
						variant='outline'
						onClick={() => toast.success('Review completed')}
					>
						Success toast
					</Button>
					<Button
						variant='outline'
						onClick={() =>
							toast.warning('Review is almost overdue')
						}
					>
						Warning toast
					</Button>
					<Button
						variant='outline'
						onClick={() => toast.error('Review could not be saved')}
					>
						Error toast
					</Button>
				</div>
			</SpecimenSection>
		</>
	)
}
