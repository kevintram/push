import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
	BellRing,
	Calendar,
	Flag,
	PanelLeftOpen,
	Settings,
	Sparkles,
} from 'lucide-react'
import type { Ref } from 'react'

import { SidebarItem } from '~/components/sidebar'
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import {
	appShellColors,
	buttonColors,
	sidebarItemColors,
} from '~/styles/colors/components.stylex'
import {
	baseColors,
	blue,
	slate,
	whiteAlpha,
} from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { SidebarRailReviewLink } from './SidebarRailReviewLink'

const hideModeOnSemanticTheme = stylex.createTheme(semanticColors, {
	surfaceSecondary: whiteAlpha.s5,
	surfaceRaised: whiteAlpha.s10,
	surfaceSunken: whiteAlpha.s5,
	surfaceTransparentHover: whiteAlpha.s10,
	surfaceTransparentActive: whiteAlpha.s15,
	surfaceInteractiveSecondary: whiteAlpha.s10,
	surfaceInteractiveSecondaryHover: whiteAlpha.s15,
	surfaceInteractiveSecondaryActive: whiteAlpha.s20,
	textPrimary: whiteAlpha.s95,
	textSecondary: slate.s300,
	textTertiary: slate.s400,
	textDisabled: slate.s400,
	textOnInverse: slate.s900,
	textOnInverseSecondary: slate.s400,
	textInteractive: slate.s200,
	textInteractiveHover: whiteAlpha.s95,
	textInteractiveActive: whiteAlpha.s95,
	textInteractiveDisabled: slate.s400,
	borderPrimary: whiteAlpha.s20,
	borderSubtle: whiteAlpha.s10,
	borderStrong: whiteAlpha.s30,
	borderFocus: blue.s300,
})

const hideModeOnItemTheme = stylex.createTheme(sidebarItemColors, {
	background: baseColors.transparent,
	backgroundHover: whiteAlpha.s10,
	backgroundSelected: whiteAlpha.s15,
	backgroundSelectedHover: whiteAlpha.s20,
	foreground: slate.s200,
	foregroundHover: whiteAlpha.s95,
	foregroundSelected: whiteAlpha.s95,
})

const hideModeOnButtonTheme = stylex.createTheme(buttonColors, {
	focusRingRest: baseColors.transparent,
	focusRing: blue.s300,
	secondaryBorder: baseColors.transparent,
	secondaryBackground: whiteAlpha.s10,
	secondaryBackgroundHover: whiteAlpha.s15,
	secondaryBackgroundPressed: whiteAlpha.s20,
	secondaryForeground: slate.s200,
	secondaryForegroundHover: whiteAlpha.s95,
	secondaryForegroundPressed: whiteAlpha.s95,
	ghostBorder: baseColors.transparent,
	ghostBackground: baseColors.transparent,
	ghostBackgroundHover: whiteAlpha.s10,
	ghostBackgroundPressed: whiteAlpha.s15,
	ghostForeground: slate.s300,
	ghostForegroundHover: whiteAlpha.s95,
	ghostForegroundPressed: whiteAlpha.s95,
	ghostDisabledBorder: baseColors.transparent,
	ghostDisabledBackground: baseColors.transparent,
	ghostDisabledForeground: slate.s500,
})

const styles = stylex.create({
	rail: {
		gap: spacing.sm,
		paddingBlock: spacing.sm,
		paddingInline: spacing.xs,
		alignItems: 'center',
		backgroundColor: appShellColors.chromeBackground,
		color: semanticColors.textPrimary,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: '48px',
		height: '100%',
		overflowY: 'hidden',
	},
	controlWrapper: {
		alignItems: 'center',
		blockSize: '36px',
		display: 'flex',
		inlineSize: '36px',
		justifyContent: 'center',
	},
	controlIcon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
	},
	railItem: {
		paddingBlock: 0,
		paddingInline: 0,
		blockSize: '36px',
		inlineSize: '36px',
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: spacing.xs,
	},
})

type AppSidebarProps = {
	hideMode: boolean
	id: string
	expanded: boolean
	onToggle: () => void
	toggleRef: Ref<HTMLButtonElement>
}

export function AppSidebar({
	hideMode,
	id,
	expanded,
	onToggle,
	toggleRef,
}: AppSidebarProps) {
	const today = useToday()
	const { data: dueEntries } = useQuery(dueQueries.listDue(today))
	const { data: newEntries } = useQuery(dueQueries.listNew())
	const { data: lateEntries } = useQuery(dueQueries.listLate(today))
	const { data: flaggedCards } = useQuery(cardQueries.listFlagged())
	const hasDue = (dueEntries?.length ?? 0) > 0
	const hasNew = (newEntries?.length ?? 0) > 0
	const hasLate = (lateEntries?.length ?? 0) > 0
	const hasFlagged = (flaggedCards?.length ?? 0) > 0

	return (
		<nav
			id={id}
			aria-label='primary'
			{...stylex.props(
				styles.rail,
				hideMode && hideModeOnSemanticTheme,
				hideMode && hideModeOnItemTheme,
				hideMode && hideModeOnButtonTheme,
			)}
		>
			<Tooltip>
				<TooltipTrigger
					render={
						<span {...stylex.props(styles.controlWrapper)}>
							<Button.Icon
								aria-label='Expand sidebar'
								aria-expanded={expanded}
								aria-controls={id}
								onClick={onToggle}
								ref={toggleRef}
								shape='round'
								size='micro'
								variant='ghost'
								xstyle={styles.railItem}
							>
								<PanelLeftOpen
									aria-hidden='true'
									size={iconSizes.md}
								/>
							</Button.Icon>
						</span>
					}
				/>
				<TooltipContent side='right'>Expand sidebar</TooltipContent>
			</Tooltip>
			<HideModeButton tooltipSide='right' xstyle={styles.railItem} />
			<SearchDialog triggerXstyle={styles.railItem} />

			<SidebarRailReviewLink
				hasCards={hasDue}
				icon={Calendar}
				label='Due'
				to='/review/due'
			/>
			<SidebarRailReviewLink
				hasCards={hasNew}
				icon={Sparkles}
				label='New'
				to='/review/new'
			/>
			<SidebarRailReviewLink
				hasCards={hasLate}
				icon={BellRing}
				label='Late'
				to='/review/late'
			/>
			<SidebarRailReviewLink
				hasCards={hasFlagged}
				icon={Flag}
				label='Flagged'
				to='/review/flagged'
			/>

			<div aria-hidden='true' {...stylex.props(styles.spacer)} />
			<Tooltip>
				<TooltipTrigger
					render={
						<SidebarItem.Icon
							ariaLabel='Settings'
							xstyle={styles.railItem}
							render={
								<Link
									activeOptions={{ exact: true }}
									to='/settings'
								/>
							}
						>
							<Settings
								aria-hidden='true'
								{...stylex.props(styles.controlIcon)}
							/>
						</SidebarItem.Icon>
					}
				/>
				<TooltipContent side='right'>Settings</TooltipContent>
			</Tooltip>
		</nav>
	)
}
