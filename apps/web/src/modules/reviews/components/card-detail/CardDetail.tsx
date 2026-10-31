import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PanelRight } from 'lucide-react'
import { type ReactElement, useId, useRef } from 'react'

import { ResizeHandle } from '~/components/ResizeHandle'
import {
	Button,
	Tabs,
	TabsList,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { usePersistedBoolean } from '~/hooks/usePersistedBoolean'
import { useResizableWidth } from '~/hooks/useResizableWidth'
import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, layout, spacing } from '~/styles/tokens.stylex'

import { CardActions } from '../CardActions'
import type { ReviewComposerDockProps } from '../reviewComposerContext'
import { ReviewComposerProvider } from '../ReviewComposerProvider'
import { CardBreadcrumbs } from './CardBreadcrumbs'
import { CardDetailHotkeys } from './CardDetailHotkeys'
import { CardOverview } from './CardOverview'
import { CardReviews } from './CardReviews'
import { CardSidebar } from './CardSidebar'
import { CardTabTrigger } from './CardTabTrigger'
import { NewReviewButton } from './NewReviewButton'
import { ReviewComposerDock } from './ReviewComposerDock'
import { ReviewComposerHotkeys } from './ReviewComposerHotkeys'

export type CardTab = 'overview' | 'reviews'

const DETAILS_SIDEBAR_STORAGE_KEY = 'cardDetailSidebarOpen'

type CardDetailBaseProps = ReviewComposerDockProps & {
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
		position: 'relative',

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
		paddingBlockEnd: spacing.sm,
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
		backgroundColor: colorsSemantic.surfaceTransparent,
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
	// Stays mounted while the details sidebar is closed, so a drag on its
	// handle can open it.
	sidebarSlot: {
		display: {
			default: 'none',
			'@container (min-width: 640px)': 'flex',
		},
		flexShrink: 0,
		// Leaves the card content at least half the row.
		maxInlineSize: '50%',
		position: 'relative',
		zIndex: 1,
	},
	sidebarSlotWidth: (width: number) => ({
		inlineSize: `${width}px`,
	}),
	// Takes no room and cancels the content gap, so the card keeps the row.
	sidebarSlotClosed: {
		inlineSize: 0,
		marginInlineStart: `calc(-1 * ${spacing.lg})`,
	},
	// The middle of the content gap beside the card.
	resizeHandle: {
		insetInlineStart: `calc(${spacing.lg} / -2)`,
	},
	// The middle of the content's end padding.
	resizeHandleClosed: {
		insetInlineStart: `calc(${spacing.lg} / 2)`,
	},
})

export function CardDetail({
	cardId,
	activeTab,
	onTabChange,
	tabLinks,
	showGoToCard = false,
	onNavigate,
	defaultDock,
	onDockChange,
	restoredDraft,
	onReviewUndone,
}: CardDetailProps) {
	const { data: card } = useSuspenseQuery(cardQueries.detail(cardId))
	const today = useToday()
	const srsState = deriveCardSrsState(card, today)
	const [sidebarOpen, setSidebarOpen] = usePersistedBoolean(
		DETAILS_SIDEBAR_STORAGE_KEY,
		true,
	)
	const sidebarId = useId()
	const overviewTabRef = useRef<HTMLElement>(null)
	const reviewsTabRef = useRef<HTMLElement>(null)
	const sidebarSlotRef = useRef<HTMLDivElement>(null)
	const sidebarToggleRef = useRef<HTMLButtonElement>(null)

	const { width: sidebarWidth, handleProps } = useResizableWidth({
		storageKey: 'cardSidebarWidth',
		defaultWidth: 335,
		minWidth: 240,
		maxWidth: 480,
		edge: 'start',
		collapse: {
			isCollapsed: !sidebarOpen,
			onCollapsedChange: isCollapsed => setSidebarOpen(!isCollapsed),
		},
	})

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen)
	}

	// The sidebar's reviews panel hides on the Reviews tab, so focus moves
	// to the tab instead of falling to the page.
	const showAllReviews =
		onTabChange &&
		(() => {
			onTabChange('reviews')
			reviewsTabRef.current?.focus()
		})

	return (
		<ReviewComposerProvider
			cardId={cardId}
			defaultDock={defaultDock}
			key={cardId}
			onDockChange={onDockChange}
			restoredDraft={restoredDraft}
			onReviewUndone={onReviewUndone}
		>
			<CardDetailHotkeys
				activeTab={activeTab}
				tabRefs={{ overview: overviewTabRef, reviews: reviewsTabRef }}
				isSidebarOpen={sidebarOpen}
				onToggleSidebar={toggleSidebar}
				sidebarRef={sidebarSlotRef}
				sidebarToggleRef={sidebarToggleRef}
			/>
			<ReviewComposerHotkeys />
			<div {...stylex.props(styles.container)}>
				<header {...stylex.props(styles.toolbar)}>
					<div {...stylex.props(styles.breadcrumbs)}>
						<CardBreadcrumbs
							primaryText={card.primaryText}
							collectionId={card.collectionId}
							onNavigate={onNavigate}
						/>
					</div>
					<CardActions
						card={card}
						hasHotkeys
						showGoToCard={showGoToCard}
					/>
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
							<CardTabTrigger
								ref={overviewTabRef}
								value='overview'
								label='Overview'
								hotkey={appHotkeys.showOverview}
								link={tabLinks?.overview}
							/>
							<CardTabTrigger
								ref={reviewsTabRef}
								value='reviews'
								label='Reviews'
								hotkey={appHotkeys.showReviews}
								link={tabLinks?.reviews}
							/>
						</TabsList>
					</Tabs>
					<div {...stylex.props(styles.secondaryToolbarActions)}>
						<NewReviewButton />
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
										ref={sidebarToggleRef}
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
								<ShortcutKeys
									hotkey={appHotkeys.toggleDetails}
								/>
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
					<div
						ref={sidebarSlotRef}
						{...stylex.props(
							styles.sidebarSlot,
							sidebarOpen
								? styles.sidebarSlotWidth(sidebarWidth)
								: styles.sidebarSlotClosed,
						)}
					>
						{sidebarOpen && (
							<CardSidebar
								id={sidebarId}
								{...srsState}
								cardId={cardId}
								showReviews={activeTab === 'overview'}
								onSeeAllReviews={showAllReviews}
								today={today}
							/>
						)}
						<ResizeHandle
							{...handleProps}
							xstyle={
								sidebarOpen
									? styles.resizeHandle
									: styles.resizeHandleClosed
							}
						/>
					</div>
				</div>
				<ReviewComposerDock />
			</div>
		</ReviewComposerProvider>
	)
}
