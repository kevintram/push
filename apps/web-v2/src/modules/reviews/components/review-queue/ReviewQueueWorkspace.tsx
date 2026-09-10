import * as stylex from '@stylexjs/stylex'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import { CardDetailErrorFallback } from '~/modules/reviews/components/card-detail/CardDetailErrorFallback'
import { CardDetailView } from '~/modules/reviews/components/card-detail/CardDetailView'
import type { Card } from '~/modules/reviews/types/review.types'
import { reviewQueueColors } from '~/styles/colors/components.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { ReviewQueueHotkeys } from './ReviewQueueHotkeys'
import { ReviewQueueSidebar } from './ReviewQueueSidebar'
import { ReviewQueueToolbar } from './ReviewQueueToolbar'
import { useReviewQueueSelection } from './useReviewQueueSelection'

type ReviewQueueWorkspaceProps = {
	cards: ReadonlyArray<Card>
	title: string
	today: DateString
}

const styles = stylex.create({
	shell: {
		padding: spacing.md,
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		minBlockSize: 0,
		minInlineSize: 0,
		overflowY: 'hidden',

		backgroundColor: reviewQueueColors.containerBackground,
	},
	panels: {
		gap: spacing.sm,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'row',
		flexGrow: 1,
		flexShrink: 1,
		minBlockSize: 0,
		minInlineSize: 0,
	},
	cardPanel: {
		borderRadius: radii.lg,
		overflow: 'hidden',
		backgroundColor: reviewQueueColors.contentBackground,
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
})

export function ReviewQueueWorkspace({
	cards,
	title,
	today,
}: ReviewQueueWorkspaceProps) {
	const shellRef = useRef<HTMLDivElement>(null)
	const { index, currentCard, canGoPrevious, canGoNext, goPrevious, goNext } =
		useReviewQueueSelection(cards)

	return (
		<section
			aria-label={`${title} review workspace`}
			ref={shellRef}
			{...stylex.props(styles.shell)}
		>
			<ReviewQueueHotkeys
				canGoPrevious={canGoPrevious}
				canGoNext={canGoNext}
				onPrevious={goPrevious}
				onNext={goNext}
				target={shellRef}
			/>
			<ReviewQueueToolbar
				currentCard={currentCard}
				index={index}
				cardCount={cards.length}
				onPrevious={goPrevious}
				onNext={goNext}
			/>
			<div {...stylex.props(styles.panels)}>
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
									FallbackComponent={CardDetailErrorFallback}
								>
									<Suspense
										key={currentCard._id}
										fallback={<LoadingIndicator />}
									>
										<CardDetailView
											cardId={currentCard._id}
										/>
									</Suspense>
								</ErrorBoundary>
							)}
						</QueryErrorResetBoundary>
					)}
				</section>
				<ReviewQueueSidebar cards={cards} title={title} today={today} />
			</div>
		</section>
	)
}
