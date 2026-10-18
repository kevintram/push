import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PanelRight } from 'lucide-react'
import { type ReactElement, useId, useState } from 'react'

import {
	Button,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { iconSizes, layout, spacing } from '~/styles/tokens.stylex'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

import { CardActions } from '../CardActions'
import { ReviewComposerProvider } from '../ReviewComposerProvider'
import { AddReviewPopover } from './AddReviewPopover'
import { CardBreadcrumbs } from './CardBreadcrumbs'
import { CardOverview } from './CardOverview'
import { CardReviews } from './CardReviews'
import { CardSidebar } from './CardSidebar'

export type CardTab = 'overview' | 'reviews'

const DETAILS_SIDEBAR_STORAGE_KEY = 'cardDetailSidebarOpen'

type CardDetailBaseProps = {
	cardId: Id<'cards'>
	activeTab: CardTab
	showGoToCard?: boolean
	/** Called when an internal breadcrumb link is about to navigate. */
	onNavigate?: () => void
}

type CardDetailProps = CardDetailBaseProps &
	(
		| {
				onTabChange: (tab: CardTab) => void
				tabLinks?: never
		  }
		| {
				onTabChange?: never
				tabLinks: Record<CardTab, ReactElement>
		  }
	)

const styles = stylex.create({
	container: {
		blockSize: '100%',
		containerType: 'inline-size',
		inlineSize: '100%',

		display: 'flex',
		flexDirection: 'column',

		overflow: 'hidden',
	},
	toolbar: {
		gap: spacing.md,
		paddingBlock: layout.topBarInset,
		paddingInline: spacing.lg,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
	},
	breadcrumbs: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
	tabsContainer: {
		flexShrink: 0,
		marginInlineStart: `calc(${spacing.sm} * -1)`,
	},
	secondaryToolbar: {
		paddingInline: spacing.lg,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
		paddingBlockEnd: spacing.xs,
	},
	secondaryToolbarActions: {
		alignItems: 'center',
		columnGap: spacing.xs,
		display: 'flex',
		flexShrink: 0,
	},
	sidebarToggle: {
		display: {
			default: 'none',
			'@container (min-width: 640px)': 'inline-flex',
		},
	},
	tabs: {
		backgroundColor: semanticColors.surfaceTransparent,
	},
	content: {
		gap: spacing.lg,
		overflow: 'hidden',
		paddingInline: spacing.lg,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		paddingBlockEnd: spacing.lg,
		minHeight: 0,
		minWidth: 0,
	},
	sidebar: {
		display: {
			default: 'none',
			'@container (min-width: 640px)': 'flex',
		},
		position: 'relative',
		zIndex: 1,
	},
	reviewFallback: {
		display: {
			default: 'flex',
			'@container (min-width: 640px)': 'none',
		},
	},
	reviewFallbackClosed: {
		display: 'flex',
	},
})

export function CardDetail({
	cardId,
	activeTab,
	onTabChange,
	tabLinks,
	showGoToCard = false,
	onNavigate,
}: CardDetailProps) {
	const { data: card } = useSuspenseQuery(cardQueries.detail(cardId))
	const today = useToday()
	const srsState = deriveCardSrsState(card, today)
	const [sidebarOpen, setSidebarOpen] = useState(() =>
		readStoredBoolean(DETAILS_SIDEBAR_STORAGE_KEY, true),
	)
	const sidebarId = useId()

	const toggleSidebar = () => {
		const nextOpen = !sidebarOpen
		setSidebarOpen(nextOpen)
		writeStoredBoolean(DETAILS_SIDEBAR_STORAGE_KEY, nextOpen)
	}

	return (
		<ReviewComposerProvider cardId={cardId} key={cardId}>
			<div {...stylex.props(styles.container)}>
				<header {...stylex.props(styles.toolbar)}>
					<div {...stylex.props(styles.breadcrumbs)}>
						<CardBreadcrumbs
							primaryText={card.primaryText}
							collectionId={card.collectionId}
							onNavigate={onNavigate}
						/>
					</div>
					<CardActions card={card} showGoToCard={showGoToCard} />
				</header>
				<div {...stylex.props(styles.secondaryToolbar)}>
					<Tabs
						value={activeTab}
						onValueChange={value => {
							if (
								onTabChange &&
								(value === 'overview' || value === 'reviews')
							) {
								onTabChange(value)
							}
						}}
						xstyle={styles.tabsContainer}
					>
						<TabsList
							aria-label='Card sections'
							xstyle={styles.tabs}
						>
							<TabsTrigger
								value='overview'
								nativeButton={tabLinks ? false : undefined}
								render={tabLinks?.overview}
							>
								Overview
							</TabsTrigger>
							<TabsTrigger
								value='reviews'
								nativeButton={tabLinks ? false : undefined}
								render={tabLinks?.reviews}
							>
								Reviews
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<div {...stylex.props(styles.secondaryToolbarActions)}>
						{activeTab === 'overview' && (
							<AddReviewPopover
								xstyle={
									sidebarOpen
										? styles.reviewFallback
										: styles.reviewFallbackClosed
								}
							/>
						)}
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										aria-label={
											sidebarOpen
												? 'Hide details'
												: 'Show details'
										}
										aria-expanded={sidebarOpen}
										aria-controls={sidebarId}
										iconOnly
										shape='round'
										variant='secondary'
										size='small'
										active={sidebarOpen}
										xstyle={styles.sidebarToggle}
										onClick={toggleSidebar}
									>
										<PanelRight
											aria-hidden='true'
											size={iconSizes.sm}
										/>
									</Button>
								}
							/>
							<TooltipContent>
								{sidebarOpen ? 'Hide details' : 'Show details'}
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
				<div {...stylex.props(styles.content)}>
					{activeTab === 'overview' ? (
						<CardOverview cardId={cardId} />
					) : (
						<CardReviews cardId={cardId} />
					)}
					{sidebarOpen && (
						<CardSidebar
							id={sidebarId}
							{...srsState}
							cardId={cardId}
							showReviews={activeTab === 'overview'}
							today={today}
							xstyle={styles.sidebar}
						/>
					)}
				</div>
			</div>
		</ReviewComposerProvider>
	)
}
