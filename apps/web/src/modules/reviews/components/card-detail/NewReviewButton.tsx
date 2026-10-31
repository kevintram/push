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

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						onClick={() =>
							setDockState(
								dock.state === 'open' ? 'minimized' : 'open',
							)
						}
						shape='round'
						size='small'
						variant='primary'
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
