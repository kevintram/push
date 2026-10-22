import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { ChevronDown, ChevronUp, Menu } from 'lucide-react'

import {
	Button,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

import {
	REVIEW_QUEUE_NEXT_HOTKEY,
	REVIEW_QUEUE_PREVIOUS_HOTKEY,
} from './reviewQueueKeybindings'

type ReviewQueueToolbarProps = {
	title: string
	count: number
	canGoPrevious: boolean
	canGoNext: boolean
	queueSidebarOpen: boolean
	queueSidebarToggleRef?: React.Ref<HTMLButtonElement>
	onPrevious: () => void
	onNext: () => void
	onQueueSidebarToggle: () => void
}

export const REVIEW_QUEUE_SIDEBAR_ID = 'review-queue-sidebar'

const styles = stylex.create({
	header: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
	},
	titleText: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
		minInlineSize: 0,
	},
	titleLabel: {
		overflow: 'hidden',
		minInlineSize: 0,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	count: {
		color: semanticColors.textSecondary,
		flexShrink: 0,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.regular,
	},
	headerButtonCluster: {
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
})

export function ReviewQueueToolbar({
	title,
	count,
	canGoPrevious,
	canGoNext,
	queueSidebarOpen,
	queueSidebarToggleRef,
	onPrevious,
	onNext,
	onQueueSidebarToggle,
}: ReviewQueueToolbarProps) {
	return (
		<header {...stylex.props(styles.header)}>
			<h1 {...stylex.props(styles.titleText)}>
				<span {...stylex.props(styles.titleLabel)}>{title}</span>
				<span aria-hidden='true' {...stylex.props(styles.count)}>
					{count}
				</span>
			</h1>
			<div {...stylex.props(styles.headerButtonCluster)}>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Next card'
								iconOnly
								shape='round'
								variant='ghost'
								size='medium'
								disabled={!canGoNext}
								onClick={onNext}
							>
								<ChevronDown size={iconSizes.sm} />
							</Button>
						}
					/>
					<TooltipContent>
						Next
						<Kbd>{formatForDisplay(REVIEW_QUEUE_NEXT_HOTKEY)}</Kbd>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Previous card'
								iconOnly
								shape='round'
								variant='ghost'
								size='medium'
								disabled={!canGoPrevious}
								onClick={onPrevious}
							>
								<ChevronUp size={iconSizes.sm} />
							</Button>
						}
					/>
					<TooltipContent>
						Previous
						<Kbd>
							{formatForDisplay(REVIEW_QUEUE_PREVIOUS_HOTKEY)}
						</Kbd>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								iconOnly
								ref={queueSidebarToggleRef}
								aria-label={
									queueSidebarOpen
										? 'Close queue'
										: 'Open queue'
								}
								aria-expanded={queueSidebarOpen}
								aria-controls={REVIEW_QUEUE_SIDEBAR_ID}
								shape='round'
								variant='ghost'
								size='medium'
								active={queueSidebarOpen}
								onClick={onQueueSidebarToggle}
							>
								<Menu size={iconSizes.sm} />
							</Button>
						}
					/>
					<TooltipContent>
						{queueSidebarOpen ? 'Close queue' : 'Open queue'}
					</TooltipContent>
				</Tooltip>
			</div>
		</header>
	)
}
