import * as stylex from '@stylexjs/stylex'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import { CardDetailErrorFallback } from '~/modules/reviews/components/card-detail/CardDetailErrorFallback'
import { CardDetailView } from '~/modules/reviews/components/card-detail/CardDetailView'
import {
	type CardTypeFilter,
	filterCardsByType,
} from '~/modules/reviews/components/card-type-filter/cardTypeFilter'
import { CardNavigationHotkeys } from '~/modules/reviews/components/CardNavigationHotkeys'
import type { Card } from '~/modules/reviews/types/review.types'
import { reviewQueueColors } from '~/styles/colors/components.stylex'
import { breakpoints, fontSizes, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import {
	REVIEW_QUEUE_NEXT_HOTKEY,
	REVIEW_QUEUE_PREVIOUS_HOTKEY,
} from './reviewQueueKeybindings'
import { ReviewQueueSidebar } from './ReviewQueueSidebar'
import { ReviewQueueToolbar } from './ReviewQueueToolbar'
import { useReviewQueueSelection } from './useReviewQueueSelection'

type ReviewQueueWorkspaceProps = {
	cards: ReadonlyArray<Card>
	title: string
	today: DateString
}

const TABLET_VIEWPORT_QUERY = '(min-width: 768px)'

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

		backgroundColor: reviewQueueColors.containerBackground,
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
	cardPanel: {
		borderRadius: radii.lg,
		overflow: 'hidden',
		backgroundColor: reviewQueueColors.contentBackground,
		boxShadow: {
			default: 'none',
			[breakpoints.desktop]: `0 0 4px ${reviewQueueColors.panelShadow}`,
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
		color: reviewQueueColors.emptyForeground,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		fontSize: fontSizes.sm,
		justifyContent: 'center',
	},
	toolbarWrapper: {
		padding: spacing.xs,
	},
})

export function ReviewQueueWorkspace({
	cards,
	title,
	today,
}: ReviewQueueWorkspaceProps) {
	const [filter, setFilter] = useState<CardTypeFilter>('all')
	const [queueSidebarOpen, setQueueSidebarOpen] = useState(isTabletViewport)
	const queueSidebarToggleRef = useRef<HTMLButtonElement>(null)

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
		index,
		currentCard,
		canGoPrevious,
		canGoNext,
		goPrevious,
		goNext,
		selectCard,
	} = useReviewQueueSelection(visibleCards)

	const onQueueSidebarToggle = () => {
		setQueueSidebarOpen(currOpen => !currOpen)
	}

	// The close control lives inside the sidebar, so closing would drop focus
	// to the document body. Hand it back to the toolbar toggle instead.
	const onQueueSidebarClose = () => {
		setQueueSidebarOpen(false)
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
				previousHotkey={REVIEW_QUEUE_PREVIOUS_HOTKEY}
				nextHotkey={REVIEW_QUEUE_NEXT_HOTKEY}
				onPrevious={goPrevious}
				onNext={goNext}
			/>
			<div {...stylex.props(styles.panels)}>
				<div {...stylex.props(styles.cardColumn)}>
					<div {...stylex.props(styles.toolbarWrapper)}>
						<ReviewQueueToolbar
							index={index}
							cardCount={visibleCards.length}
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
												showGoToCard
											/>
										</Suspense>
									</ErrorBoundary>
								)}
							</QueryErrorResetBoundary>
						)}
					</section>
				</div>
				{queueSidebarOpen && (
					<ReviewQueueSidebar
						cards={visibleCards}
						title={title}
						today={today}
						currentCardId={currentCard?._id ?? null}
						onCardClick={selectCard}
						filter={filter}
						onFilterChange={setFilter}
						onClose={onQueueSidebarClose}
					/>
				)}
			</div>
		</section>
	)
}
