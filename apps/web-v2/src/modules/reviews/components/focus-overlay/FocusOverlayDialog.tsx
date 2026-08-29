import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, ChevronLeft, ChevronRight, Copy, X } from 'lucide-react'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
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
import type { Card } from '~/modules/reviews/types/review.types'
import {
	focusOverlayColors,
	hideModeButtonColors,
} from '~/styles/colors/components.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { HIDE_MODE_HOTKEY } from '../../hide-mode/hideModeHotkey'
import { useHideMode } from '../../hide-mode/useHideMode'
import { FocusOverlayCard } from './FocusOverlayCard'
import { FocusOverlayCardError } from './FocusOverlayCardError'
import {
	FOCUS_OVERLAY_NEXT_HOTKEY,
	FOCUS_OVERLAY_PREVIOUS_HOTKEY,
} from './focusOverlayHotkey'
import { FocusOverlayNavigationHotkeys } from './FocusOverlayNavigationHotkeys'

type FocusOverlayDialogProps = {
	handle: DialogHandle
	cards: ReadonlyArray<Card>
}

type IdAndIndex = {
	id: Id<'cards'> | null
	index: number
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
		backgroundColor: focusOverlayColors.containerBackground,
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
		backgroundColor: focusOverlayColors.cardBackground,
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
	cards: ReadonlyArray<Card>,
	selection: IdAndIndex,
): number {
	if (cards.length === 0) return -1
	if (selection.id === null) {
		return Math.min(selection.index, cards.length - 1)
	}

	const index = cards.findIndex(({ _id }) => _id === selection.id)
	if (index !== -1) return index

	return Math.min(selection.index, cards.length - 1)
}

/**
 * The position state deliberately outlives a close: reopening Focus resumes on
 * the card the user was reading rather than jumping back to the top of the
 * queue. Reveal and tab state do not — the keyed card panel unmounts with the
 * popup, so a reopened card starts from Overview with its answer unrevealed.
 */
export function FocusOverlayDialog({ handle, cards }: FocusOverlayDialogProps) {
	const { hideMode, toggleHideMode } = useHideMode()
	const contentRef = useRef<HTMLDivElement>(null)
	const [selection, setSelection] = useState<IdAndIndex>(() => ({
		id: cards[0]?._id ?? null,
		index: 0,
	}))

	const index = resolveIndex(cards, selection)
	const currentCard = cards[index] ?? null
	const resolvedId = currentCard?._id ?? null

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
		const previous = cards[previousIndex]
		if (previous) setSelection({ id: previous._id, index: previousIndex })
	}, [index, cards])

	const goNext = useCallback(() => {
		const nextIndex = index + 1
		const next = index === -1 ? undefined : cards[nextIndex]
		if (next) setSelection({ id: next._id, index: nextIndex })
	}, [index, cards])

	return (
		<Dialog handle={handle}>
			<DialogContent
				ref={contentRef}
				aria-label='Focus cards'
				viewportXstyle={styles.viewport}
				xstyle={styles.content}
				showCloseButton={false}
			>
				<FocusOverlayNavigationHotkeys
					canGoPrevious={index > 0}
					canGoNext={index !== -1 && index < cards.length - 1}
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
												FOCUS_OVERLAY_PREVIOUS_HOTKEY,
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
												FOCUS_OVERLAY_NEXT_HOTKEY,
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
									? 'Turn off hide mode'
									: 'Turn on hide mode'}
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
													aria-label='Open card'
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
								<TooltipContent>Open card</TooltipContent>
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
									FallbackComponent={FocusOverlayCardError}
								>
									{/* Remount per card so the fallback shows
									    cleanly and reveal state starts fresh. */}
									<Suspense
										key={currentCard._id}
										fallback={<LoadingIndicator />}
									>
										<FocusOverlayCard
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
