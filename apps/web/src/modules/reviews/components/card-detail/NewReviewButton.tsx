import type * as stylex from '@stylexjs/stylex'
import { SquarePen } from 'lucide-react'

import { Button } from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

import { useReviewComposerState } from '../reviewComposerContext'

type NewReviewButtonProps = {
	xstyle?: stylex.StyleXStyles
}

export function NewReviewButton({ xstyle }: NewReviewButtonProps) {
	const { dockState, setDockState } = useReviewComposerState()

	return (
		<Button
			onClick={() =>
				setDockState(dockState === 'open' ? 'minimized' : 'open')
			}
			shape='round'
			size='small'
			variant='primary'
			xstyle={xstyle}
		>
			<SquarePen aria-hidden='true' size={iconSizes.sm} />
			New review
		</Button>
	)
}
