import * as stylex from '@stylexjs/stylex'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import { ResizeHandle } from '~/components/ResizeHandle'
import { useResizableWidth } from '~/hooks/useResizableWidth'
import { CardDetailErrorFallback } from '~/modules/reviews/components/card-detail/CardDetailErrorFallback'
import { CardDetailView } from '~/modules/reviews/components/card-detail/CardDetailView'
import {
	type CardTypeFilter,
	filterCardsByType,
} from '~/modules/reviews/components/card-type-filter/cardTypeFilter'
import { CardNavigationHotkeys } from '~/modules/reviews/components/CardNavigationHotkeys'
import type {
	ReviewComposerDock,
	ReviewDraft,
} from '~/modules/reviews/components/reviewComposerContext'
import type { Card } from '~/modules/reviews/types/review.types'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { baseColors } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { breakpoints, fontSizes, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

import { ReviewQueueSidebar } from './ReviewQueueSidebar'
import { ReviewQueueToolbar } from './ReviewQueueToolbar'
import { useReviewQueueSelection } from './useReviewQueueSelection'

type ReviewQueueWorkspaceProps = {
	cards: ReadonlyArray<Card>
	title: string
	today: DateString
}

const TABLET_VIEWPORT_QUERY = '(min-width: 768px)'
const QUEUE_SIDEBAR_STORAGE_KEY = 'reviewQueueSidebarOpen'

function isTabletViewport() {
	return (
		typeof window === 'undefined' ||
		typeof window.matchMedia !== 'function' ||
		window.matchMedia(TABLET_VIEWPORT_QUERY).matches
	)
}

const styles = stylex.create({
	shell: {
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		minBlockSize: 0,
		minInlineSize: 0,
		overflowY: 'hidden',

		borderColor: colorsSemantic.borderSubtle,
		borderRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: colorsSemantic.surfaceTertiary,
	},
	panels: {
		padding: spacing.sm,
		gap: spacing.sm,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'row',
		flexGrow: 1,
		flexShrink: 1,
		minBlockSize: 0,
		minInlineSize: 0,
	},
	panelsCollapsed: {
		paddingInline: spacing.xs,
		paddingBlockEnd: spacing.xs,
	},
	// Stays mounted while the queue sidebar is closed, so a drag on its handle
	// can open it.
	sidebarSlot: {
		display: 'flex',
		flexShrink: 0,
		// TODO: add mobile drawer
		// Leaves the card at least half the row; the only bound on dragging wider.
		maxInlineSize: '50%',
		minBlockSize: 0,
		position: 'relative',
	},
	sidebarSlotWidth: (width: number) => ({
		inlineSize: `${width}px`,
	}),
	// Takes no room and cancels the panels gap, so the card keeps the row.
	sidebarSlotClosed: {
		inlineSize: 0,
		marginInlineStart: `calc(-1 * ${spacing.sm})`,
	},
	// The middle of the panels gap beside the card.
	resizeHandle: {
		insetInlineStart: `calc(${spacing.sm} / -2)`,
	},
	// Ends the 12px handle at the collapsed panels' edge. The padding is only
	// 4px, and anything past it would scroll the workspace sideways.
	resizeHandleClosed: {
		insetInlineStart: `calc(${spacing.xs} - ${spacing.md} / 2)`,
	},
	cardColumn: {
		gap: spacing.xs,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
		flexShrink: 1,
		minBlockSize: 0,
		minInlineSize: 0,
	},
	// Toolbar controls and the sidebar close button are both 36px; offset by
	// the sidebar's 1px top border so their centers line up. With the sidebar
	// closed there is nothing to align with, so the toolbar sits flush.
	toolbarBesideSidebar: {
		paddingBlockEnd: spacing.sm,
		paddingBlockStart: `calc(${spacing.sm} + 1px)`,
	},
	cardPanel: {
		borderColor: {
			default: colorsSemantic.borderSubtle,
			'@media (prefers-color-scheme: dark)': baseColors.transparent,
		},
		borderRadius: radii['2xl'],
		borderStyle: 'solid',
		borderWidth: 1,
		overflow: 'hidden',
		backgroundColor: colorsSemantic.surfacePrimary,
		boxShadow: {
			default: 'none',
			[breakpoints.desktop]: `0 0 4px ${colorsSemantic.shadowSubtle}`,
		},
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minBlockSize: 0,
		minInlineSize: 0,
	},
	empty: {
		alignItems: 'center',
		color: colorsSemantic.textSecondary,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		fontSize: fontSizes.sm,
		justifyContent: 'center',
	},
})

export function ReviewQueueWorkspace({
	cards,
	title,
	today,
}: ReviewQueueWorkspaceProps) {
	const [filter, setFilter] = useState<CardTypeFilter>('all')
	// The preference describes the tablet-and-up layout. Small viewports always
	// start closed and never overwrite it.
	const [queueSidebarOpen, setQueueSidebarOpen] = useState(
		() =>
			isTabletViewport() &&
			readStoredBoolean(QUEUE_SIDEBAR_STORAGE_KEY, true),
	)
	const queueSidebarToggleRef = useRef<HTMLButtonElement>(null)
	// Each card starts its composer where the user last left it, so hiding it
	// once keeps it hidden through the rest of the queue. The expanded dialog
	// is modal, so a card opens it docked instead; a minimized one still
	// restores to the dialog.
	const [dock, setDock] = useState<ReviewComposerDock>({
		state: 'open',
		isExpanded: false,
	})
	const cardDock =
		dock.state === 'open' ? { ...dock, isExpanded: false } : dock

	useEffect(() => {
		if (typeof window.matchMedia !== 'function') {
			return
		}

		const tabletViewport = window.matchMedia(TABLET_VIEWPORT_QUERY)
		const closeSidebarOnSmallViewport = (event: MediaQueryListEvent) => {
			if (!event.matches) {
				setQueueSidebarOpen(false)
			}
		}

		tabletViewport.addEventListener('change', closeSidebarOnSmallViewport)

		return () => {
			tabletViewport.removeEventListener(
				'change',
				closeSidebarOnSmallViewport,
			)
		}
	}, [])

	const visibleCards = filterCardsByType(cards, filter)
	const {
		currentCard,
		canGoPrevious,
		canGoNext,
		goPrevious,
		goNext,
		selectCard,
		returnTo,
	} = useReviewQueueSelection(visibleCards)

	// The draft of a review undone after the queue moved on from its card,
	// held until the card is back and left again.
	const [restored, setRestored] = useState<{
		cardId: Card['_id']
		draft: ReviewDraft
	} | null>(null)
	const showingRestored =
		restored !== null && restored.cardId === currentCard?._id
	useEffect(() => {
		if (showingRestored) return () => setRestored(null)
	}, [showingRestored])

	const setQueueSidebarPreference = (open: boolean) => {
		setQueueSidebarOpen(open)
		if (isTabletViewport()) {
			writeStoredBoolean(QUEUE_SIDEBAR_STORAGE_KEY, open)
		}
	}

	const { width: queueSidebarWidth, handleProps } = useResizableWidth({
		storageKey: 'reviewQueueSidebarWidth',
		defaultWidth: 320,
		minWidth: 240,
		edge: 'start',
		collapse: {
			isCollapsed: !queueSidebarOpen,
			onCollapsedChange: isCollapsed =>
				setQueueSidebarPreference(!isCollapsed),
		},
	})

	const onQueueSidebarToggle = () => {
		setQueueSidebarPreference(!queueSidebarOpen)
	}

	// The close control lives inside the sidebar, so closing would drop focus
	// to the document body. Hand it back to the toolbar toggle instead.
	const onQueueSidebarClose = () => {
		setQueueSidebarPreference(false)
		queueSidebarToggleRef.current?.focus()
	}

	return (
		<section
			aria-label={`${title} review workspace`}
			{...stylex.props(styles.shell)}
		>
			<CardNavigationHotkeys
				canGoPrevious={canGoPrevious}
				canGoNext={canGoNext}
				previousHotkey={appHotkeys.previousCard}
				nextHotkey={appHotkeys.nextCard}
				onPrevious={goPrevious}
				onNext={goNext}
			/>
			<div
				{...stylex.props(
					styles.panels,
					!queueSidebarOpen && styles.panelsCollapsed,
				)}
			>
				<div {...stylex.props(styles.cardColumn)}>
					<div
						{...stylex.props(
							queueSidebarOpen && styles.toolbarBesideSidebar,
						)}
					>
						<ReviewQueueToolbar
							title={title}
							count={cards.length}
							canGoPrevious={canGoPrevious}
							canGoNext={canGoNext}
							queueSidebarOpen={queueSidebarOpen}
							queueSidebarToggleRef={queueSidebarToggleRef}
							onPrevious={goPrevious}
							onNext={goNext}
							onQueueSidebarToggle={onQueueSidebarToggle}
						/>
					</div>
					<section
						aria-label='Current card'
						{...stylex.props(styles.cardPanel)}
					>
						{currentCard === null ? (
							<div {...stylex.props(styles.empty)}>
								No cards to review.
							</div>
						) : (
							<QueryErrorResetBoundary>
								{({ reset }) => (
									<ErrorBoundary
										onReset={reset}
										resetKeys={[currentCard._id]}
										FallbackComponent={
											CardDetailErrorFallback
										}
									>
										<Suspense
											key={currentCard._id}
											fallback={<LoadingIndicator />}
										>
											<CardDetailView
												cardId={currentCard._id}
												defaultDock={cardDock}
												onDockChange={setDock}
												restoredDraft={
													showingRestored
														? restored.draft
														: undefined
												}
												onReviewUndone={draft => {
													setRestored({
														cardId: currentCard._id,
														draft,
													})
													returnTo(currentCard._id)
												}}
												showGoToCard
											/>
										</Suspense>
									</ErrorBoundary>
								)}
							</QueryErrorResetBoundary>
						)}
					</section>
				</div>
				<div
					{...stylex.props(
						styles.sidebarSlot,
						queueSidebarOpen
							? styles.sidebarSlotWidth(queueSidebarWidth)
							: styles.sidebarSlotClosed,
					)}
				>
					{queueSidebarOpen && (
						<ReviewQueueSidebar
							cards={visibleCards}
							today={today}
							currentCardId={currentCard?._id ?? null}
							onCardClick={selectCard}
							filter={filter}
							onFilterChange={setFilter}
							onClose={onQueueSidebarClose}
						/>
					)}
					<ResizeHandle
						{...handleProps}
						xstyle={
							queueSidebarOpen
								? styles.resizeHandle
								: styles.resizeHandleClosed
						}
					/>
				</div>
			</div>
		</section>
	)
}
