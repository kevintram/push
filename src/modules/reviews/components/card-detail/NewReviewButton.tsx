import type * as stylex from '@stylexjs/stylex'
import { SquarePen } from 'lucide-react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { iconSizes } from '~/styles/tokens.stylex'

import { useReviewComposerState } from '../reviewComposerContext'

type NewReviewButtonProps = {
	xstyle?: stylex.StyleXStyles
}

export function NewReviewButton({ xstyle }: NewReviewButtonProps) {
	const { dock, setDockState } = useReviewComposerState()
	// Steps back while the docked composer is showing, since a click then
	// minimizes it rather than starting a review.
	const isOpen = dock.state === 'open'

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						aria-expanded={isOpen}
						onClick={() =>
							setDockState(isOpen ? 'minimized' : 'open')
						}
						shape='round'
						size='small'
						variant={isOpen ? 'secondary' : 'primary'}
						xstyle={xstyle}
					>
						<SquarePen aria-hidden='true' size={iconSizes.sm} />
						New review
					</Button>
				}
			/>
			<TooltipContent>
				New review
				<ShortcutKeys hotkey={appHotkeys.newReview} />
			</TooltipContent>
		</Tooltip>
	)
}
