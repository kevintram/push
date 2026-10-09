import * as stylex from '@stylexjs/stylex'
import { ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'

import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { ReviewComposer } from '../ReviewComposer'

const styles = stylex.create({
	container: {
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'flex-end',
		minInlineSize: 0,
	},
	content: {
		padding: spacing.sm,

		inlineSize: 'min(20rem, calc(100vw - 2rem))',
		maxInlineSize: 'calc(100vw - 2rem)',
		minInlineSize: 0,
	},
})

type AddReviewPopoverProps = {
	xstyle?: stylex.StyleXStyles
}

export function AddReviewPopover({ xstyle }: AddReviewPopoverProps) {
	const [open, setOpen] = useState(false)

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger
					render={
						<Button
							aria-label='Add review'
							shape='round'
							size='tiny'
						>
							<Plus size={iconSizes.xs} />
							Add review
							<ChevronDown size={iconSizes.xs} />
						</Button>
					}
				/>
				<PopoverContent align='end' xstyle={styles.content}>
					<ReviewComposer
						autoFocusDescription
						onCancel={() => setOpen(false)}
						onSuccess={() => setOpen(false)}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}
