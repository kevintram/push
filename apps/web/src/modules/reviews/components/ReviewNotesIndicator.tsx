import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { File } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes } from '~/styles/tokens.stylex'

const PREVIEW_LENGTH = 80

const styles = stylex.create({
	trigger: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	icon: {
		blockSize: iconSizes.sm,
		color: colorsSemantic.textSecondary,
		display: 'block',
		inlineSize: iconSizes.sm,
	},
})

/** The first line of the notes, cut to fit a one-line tooltip. */
function previewNotes(notes: string) {
	const [firstLine = ''] = notes.trim().split('\n')
	return firstLine.length > PREVIEW_LENGTH
		? `${firstLine.slice(0, PREVIEW_LENGTH).trimEnd()}…`
		: firstLine
}

type ReviewNotesIndicatorProps = {
	notes: string
	xstyle?: StyleXStyles
}

/** Marks a review that has notes, previewing them on hover. */
export function ReviewNotesIndicator({
	notes,
	xstyle,
}: ReviewNotesIndicatorProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={<span {...stylex.props(styles.trigger, xstyle)} />}
			>
				<File aria-label='Has notes' {...stylex.props(styles.icon)} />
			</TooltipTrigger>
			<TooltipContent>{previewNotes(notes)}</TooltipContent>
		</Tooltip>
	)
}
