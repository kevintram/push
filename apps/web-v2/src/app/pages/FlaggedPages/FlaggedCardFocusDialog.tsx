import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, ChevronLeft, ChevronRight, Copy, X } from 'lucide-react'
import { Suspense, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	type DialogHandle,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { CardDetailErrorFallback } from '~/modules/reviews/components/card-detail/CardDetailErrorFallback'
import { CardDetailView } from '~/modules/reviews/components/card-detail/CardDetailView'
import { ReviewQueueHotkeys } from '~/modules/reviews/components/review-queue/ReviewQueueHotkeys'
import {
	REVIEW_QUEUE_NEXT_HOTKEY,
	REVIEW_QUEUE_PREVIOUS_HOTKEY,
} from '~/modules/reviews/components/review-queue/reviewQueueKeybindings'
import { useReviewQueueSelection } from '~/modules/reviews/components/review-queue/useReviewQueueSelection'
import { HIDE_MODE_HOTKEY } from '~/modules/reviews/hide-mode/hideModeHotkey'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import type { Card } from '~/modules/reviews/types/review.types'
import {
	flaggedCardFocusColors,
	hideModeButtonColors,
} from '~/styles/colors/components.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

type FlaggedCardFocusDialogProps = {
	handle: DialogHandle
	cards: ReadonlyArray<Card>
}

const styles = stylex.create({
	viewport: {
		padding: spacing.none,
		placeItems: 'stretch',
		overflowY: 'hidden',
	},
	content: {
		gap: 0,
		blockSize: '100dvh',
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100dvw',
		maxInlineSize: 'none',

		paddingBlockEnd: spacing.md,
		paddingBlockStart: 0,
		paddingInlineEnd: spacing.md,
		paddingInlineStart: spacing.md,

		borderRadius: 0,
		borderWidth: '0px',
		backgroundColor: flaggedCardFocusColors.containerBackground,
		boxShadow: 'none',
		transform: {
			default: 'none',
			':is([data-starting-style], [data-ending-style])': 'none',
		},
		overflowY: 'auto',
	},
	inner: {
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,

		borderRadius: radii.lg,
		backgroundColor: flaggedCardFocusColors.cardBackground,
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
	hideModeOn: {
		backgroundColor: {
			default: hideModeButtonColors.backgroundActive,
			':hover': hideModeButtonColors.backgroundActiveHover,
		},
		color: hideModeButtonColors.foregroundActive,
	},
	position: {
		paddingInline: spacing.xs,

		color: flaggedCardFocusColors.positionForeground,
		fontSize: fontSizes.sm,
	},
	empty: {
		alignItems: 'center',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',

		color: flaggedCardFocusColors.emptyForeground,
		fontSize: fontSizes.sm,
	},
})

/**
 * The position state deliberately outlives a close: reopening focus resumes on
 * the card the user was reading rather than jumping back to the top of the
 * queue. Reveal and tab state do not — the keyed card detail unmounts with the
 * popup, so a reopened card starts from Overview with its answer unrevealed.
 */
export function FlaggedCardFocusDialog({
	handle,
	cards,
}: FlaggedCardFocusDialogProps) {
	const { hideMode, toggleHideMode } = useHideMode()
	const contentRef = useRef<HTMLDivElement>(null)
	const { index, currentCard, canGoPrevious, canGoNext, goPrevious, goNext } =
		useReviewQueueSelection(cards)

	return (
		<Dialog handle={handle}>
			<DialogContent
				ref={contentRef}
				aria-label='Focus cards'
				viewportXstyle={styles.viewport}
				xstyle={styles.content}
				showCloseButton={false}
			>
				<ReviewQueueHotkeys
					canGoPrevious={canGoPrevious}
					canGoNext={canGoNext}
					onPrevious={goPrevious}
					onNext={goNext}
					target={contentRef}
				/>
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.headerButtonCluster)}>
						{currentCard === null ? null : (
							<>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button.Icon
												aria-label='Previous card'
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
									<TooltipContent>
										Previous
										<Kbd>
											{formatForDisplay(
												REVIEW_QUEUE_PREVIOUS_HOTKEY,
											)}
										</Kbd>
									</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button.Icon
												aria-label='Next card'
												shape='round'
												variant='secondary'
												size='small'
												disabled={
													index === cards.length - 1
												}
												onClick={goNext}
											>
												<ChevronRight
													size={iconSizes.md}
												/>
											</Button.Icon>
										}
									/>
									<TooltipContent>
										Next
										<Kbd>
											{formatForDisplay(
												REVIEW_QUEUE_NEXT_HOTKEY,
											)}
										</Kbd>
									</TooltipContent>
								</Tooltip>
								<span {...stylex.props(styles.position)}>
									{index + 1} of {cards.length}
								</span>
							</>
						)}
					</div>
					<div {...stylex.props(styles.headerButtonCluster)}>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button.Icon
										aria-label='Toggle hide mode'
										aria-pressed={hideMode === 'on'}
										shape='round'
										variant='secondary'
										size='small'
										xstyle={
											hideMode === 'on' &&
											styles.hideModeOn
										}
										onClick={toggleHideMode}
									>
										<Copy size={iconSizes.md} />
									</Button.Icon>
								}
							/>
							<TooltipContent>
								{hideMode === 'on'
									? 'Show answers and notes'
									: 'Hide answers and notes'}
								<Kbd>{formatForDisplay(HIDE_MODE_HOTKEY)}</Kbd>
							</TooltipContent>
						</Tooltip>
						{/* This close renders an anchor, so both it and the button
						    primitive it wraps need telling that the final element
						    is not a native button. */}
						{currentCard === null ? null : (
							<Tooltip>
								<TooltipTrigger
									render={
										<DialogClose
											nativeButton={false}
											render={
												<Button.Icon
													aria-label='Go to card'
													shape='round'
													variant='secondary'
													size='small'
													nativeButton={false}
													render={
														<Link
															to='/cards/$cardId'
															params={{
																cardId: currentCard._id,
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
								<TooltipContent>Go to card</TooltipContent>
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
									{/* Remount per card so the fallback shows
									    cleanly and reveal state starts fresh. */}
									<Suspense
										key={currentCard._id}
										fallback={<LoadingIndicator />}
									>
										<CardDetailView
											cardId={currentCard._id}
											onNavigate={() => handle.close()}
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
