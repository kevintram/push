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
import { iconSizes } from '~/styles/tokens.stylex'

import {
	REVIEW_QUEUE_NEXT_HOTKEY,
	REVIEW_QUEUE_PREVIOUS_HOTKEY,
} from './reviewQueueKeybindings'

type ReviewQueueToolbarProps = {
	index: number
	cardCount: number
	queueSidebarOpen: boolean
	queueSidebarToggleRef?: React.Ref<HTMLButtonElement>
	onPrevious: () => void
	onNext: () => void
	onQueueSidebarToggle: () => void
}

export const REVIEW_QUEUE_SIDEBAR_ID = 'review-queue-sidebar'

const styles = stylex.create({
	header: {
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'flex-end',
	},
	headerButtonCluster: {
		alignItems: 'center',
		display: 'flex',
	},
})

export function ReviewQueueToolbar({
	index,
	cardCount,
	queueSidebarOpen,
	queueSidebarToggleRef,
	onPrevious,
	onNext,
	onQueueSidebarToggle,
}: ReviewQueueToolbarProps) {
	return (
		<header {...stylex.props(styles.header)}>
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
								disabled={index >= cardCount - 1}
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
								disabled={index <= 0}
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
