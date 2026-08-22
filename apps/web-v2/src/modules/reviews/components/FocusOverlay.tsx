import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	type DialogHandle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import type { ReviewCard } from '~/modules/reviews/types/review.types'
import { focusOverlayColors } from '~/styles/componentColors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { FocusOverlayCardError } from './FocusOverlayCardError'
import { ReviewCardOverview } from './ReviewCardOverview'

type FocusOverlayProps = {
	handle: DialogHandle
	reviewCards: ReadonlyArray<ReviewCard>
}

type IdAndIndex = {
	id: Id<'reviewCards'> | null
	index: number
}

const styles = stylex.create({
	content: {
		gap: 0,
		display: 'flex',
		flexDirection: 'column',

		backgroundColor: focusOverlayColors.containerBackground,

		paddingBlockEnd: spacing.md,
		paddingBlockStart: 0,
		paddingInlineEnd: spacing.md,
		paddingInlineStart: spacing.md,
	},
	inner: {
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,

		borderRadius: radii.lg,
		backgroundColor: focusOverlayColors.cardBackground,

		padding: spacing.lg,
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',

		paddingBlock: spacing.md,
	},
	headerButtonCluster: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
	},
	position: {
		paddingInline: spacing.xs,

		color: focusOverlayColors.positionForeground,
		fontSize: fontSizes.sm,
	},
	empty: {
		alignItems: 'center',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',

		color: focusOverlayColors.emptyForeground,
		fontSize: fontSizes.sm,
	},
})

/**
 * Finds the selected card's current position in the live queue.
 *
 * Tracking by ID keeps the same card selected when earlier cards are added or
 * removed. If the selected card leaves the queue, its last known index chooses
 * the card that replaced it, clamped to the new end of the queue. `-1` means
 * the queue is empty.
 */
function resolveIndex(
	reviewCards: ReadonlyArray<ReviewCard>,
	selection: IdAndIndex,
): number {
	if (reviewCards.length === 0) return -1
	if (selection.id === null) {
		return Math.min(selection.index, reviewCards.length - 1)
	}

	const index = reviewCards.findIndex(({ _id }) => _id === selection.id)
	if (index !== -1) return index

	return Math.min(selection.index, reviewCards.length - 1)
}

/**
 * The position state deliberately outlives a close: reopening Focus resumes on
 * the card the user was reading rather than jumping back to the top of the
 * queue. Reveal state does not — `ReviewCardOverview` unmounts with the popup,
 * so a reopened card never shows its answer already revealed.
 */
export function FocusOverlay({ handle, reviewCards }: FocusOverlayProps) {
	const [selection, setSelection] = useState<IdAndIndex>(() => ({
		id: reviewCards[0]?._id ?? null,
		index: 0,
	}))

	const index = resolveIndex(reviewCards, selection)
	const currentReviewCard = reviewCards[index] ?? null
	const resolvedId = currentReviewCard?._id ?? null

	// Keep the fallback position current when the selected card moves. If that
	// card leaves the queue, adopt the card at its former position so subsequent
	// queue updates continue tracking the replacement by identity.
	useEffect(() => {
		if (resolvedId === null) return

		setSelection(current => {
			if (current.id === resolvedId && current.index === index)
				return current
			return { id: resolvedId, index }
		})
	}, [index, resolvedId])

	// Clamped at both ends: in a review queue, wraparound makes "am I done?"
	// unanswerable.
	const goPrevious = useCallback(() => {
		const previousIndex = index - 1
		const previous = reviewCards[previousIndex]
		if (previous) setSelection({ id: previous._id, index: previousIndex })
	}, [index, reviewCards])

	const goNext = useCallback(() => {
		const nextIndex = index + 1
		const next = index === -1 ? undefined : reviewCards[nextIndex]
		if (next) setSelection({ id: next._id, index: nextIndex })
	}, [index, reviewCards])

	return (
		<Dialog handle={handle}>
			<DialogContent
				aria-label='Focus review cards'
				size='fullscreen'
				xstyle={styles.content}
				showCloseButton={false}
			>
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.headerButtonCluster)}>
						{currentReviewCard === null ? null : (
							<>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button.Icon
												aria-label='Previous review card'
												shape='round'
												variant='secondary'
												size='small'
												disabled={index === 0}
												onClick={goPrevious}
											>
												<ChevronLeft
													size={iconSizes.md}
												/>
											</Button.Icon>
										}
									/>
									<TooltipContent>Previous</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button.Icon
												aria-label='Next review card'
												shape='round'
												variant='secondary'
												size='small'
												disabled={
													index ===
													reviewCards.length - 1
												}
												onClick={goNext}
											>
												<ChevronRight
													size={iconSizes.md}
												/>
											</Button.Icon>
										}
									/>
									<TooltipContent>Next</TooltipContent>
								</Tooltip>
								<span {...stylex.props(styles.position)}>
									{index + 1} of {reviewCards.length}
								</span>
							</>
						)}
					</div>
					<div {...stylex.props(styles.headerButtonCluster)}>
						{/* This close renders an anchor, so both it and the button
						    primitive it wraps need telling that the final element
						    is not a native button. */}
						{currentReviewCard === null ? null : (
							<Tooltip>
								<TooltipTrigger
									render={
										<DialogClose
											nativeButton={false}
											render={
												<Button.Icon
													aria-label='Open review card'
													shape='round'
													variant='secondary'
													size='small'
													nativeButton={false}
													render={
														<Link
															to='/review-cards/$reviewCardId'
															params={{
																reviewCardId:
																	currentReviewCard._id,
															}}
														/>
													}
												/>
											}
										>
											<ArrowUpRight size={iconSizes.md} />
										</DialogClose>
									}
								/>
								<TooltipContent>
									Open review card
								</TooltipContent>
							</Tooltip>
						)}
						<DialogClose
							render={
								<Button.Icon
									aria-label='Close'
									shape='round'
									variant='secondary'
									size='small'
								/>
							}
						>
							<X aria-hidden='true' size={iconSizes.md} />
						</DialogClose>
					</div>
				</div>
				<div {...stylex.props(styles.inner)}>
					{currentReviewCard === null ? (
						<div {...stylex.props(styles.empty)}>
							No cards to review.
						</div>
					) : (
						<QueryErrorResetBoundary>
							{({ reset }) => (
								<ErrorBoundary
									onReset={reset}
									resetKeys={[currentReviewCard._id]}
									FallbackComponent={FocusOverlayCardError}
								>
									{/* Remount per card so the fallback shows
									    cleanly and reveal state starts fresh. */}
									<Suspense
										key={currentReviewCard._id}
										fallback={<LoadingIndicator />}
									>
										<ReviewCardOverview
											reviewCardId={currentReviewCard._id}
										/>
									</Suspense>
								</ErrorBoundary>
							)}
						</QueryErrorResetBoundary>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
