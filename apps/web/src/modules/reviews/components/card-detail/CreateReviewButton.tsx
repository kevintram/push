import type * as stylex from '@stylexjs/stylex'
import { SquarePen } from 'lucide-react'

import { Button } from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

import { useReviewComposerState } from '../reviewComposerContext'

type CreateReviewButtonProps = {
	xstyle?: stylex.StyleXStyles
}

export function CreateReviewButton({ xstyle }: CreateReviewButtonProps) {
	const { setDockState } = useReviewComposerState()

	return (
		<Button
			onClick={() => setDockState('open')}
			shape='round'
			size='small'
			variant='primary'
			xstyle={xstyle}
		>
			<SquarePen aria-hidden='true' size={iconSizes.sm} />
			Create review
		</Button>
	)
}
