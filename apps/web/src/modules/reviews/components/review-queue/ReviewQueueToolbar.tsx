import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp, Menu } from 'lucide-react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	buttonSizes,
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

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
		paddingInline: spacing.md,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
	},
	titleText: {
		gap: spacing.sm,
		alignItems: 'baseline',
		display: 'flex',
		fontSize: fontSizes['2xl'],
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
		color: colorsSemantic.textSecondary,
		flexShrink: 0,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.regular,
		// move 1px up for visual balance
		insetBlockStart: '-1px',
		position: 'relative',
	},
	headerButtonCluster: {
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		// Pulls the ghost buttons into the padding by their own inset so their
		// glyphs, not their hidden hover areas, sit on the content edge.
		marginInlineEnd: `calc((${buttonSizes.medium} - ${iconSizes.sm}) / -2)`,
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
						<ShortcutKeys hotkey={appHotkeys.nextCard} />
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
						<ShortcutKeys hotkey={appHotkeys.previousCard} />
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
