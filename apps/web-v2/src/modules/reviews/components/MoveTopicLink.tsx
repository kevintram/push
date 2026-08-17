import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '~/components/ui'
import type { TopicWithChildren } from '~/modules/library/types/topic.types'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',

		borderRadius: radii.lg,
	},
	row: {
		borderRadius: radii.lg,
		gap: spacing.xs,

		alignItems: 'center',
		backgroundColor: {
			default: 'inherit',
			':hover': colors.navBgSurfaceHover,
		},
		display: 'grid',
		gridTemplateColumns: '26px minmax(0, 1fr)',
	},
	rowSelected: {
		backgroundColor: {
			default: colors.navBgSurfaceActive,
			':hover': colors.navBgSurfaceActive,
		},
	},
	togglePlaceholder: {
		blockSize: '26px',
		inlineSize: '26px',
	},
	chevron: {
		transform: 'rotate(0deg)',
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
	},
	chevronExpanded: {
		transform: 'rotate(90deg)',
	},
	childrenList: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		margin: 0,
		paddingBlock: 0,
		listStyleType: 'none',
		paddingInlineEnd: 0,
		paddingInlineStart: spacing.md,
	},
	childrenListCollapsed: {
		display: 'none',
	},
	topicButton: {
		padding: spacing.xs,
		textDecoration: 'none',
		textAlign: 'start',

		borderWidth: 0,
		alignItems: 'center',
		backgroundColor: 'transparent',
		color: {
			default: colors.textLink,
			':hover': colors.textLinkHover,
		},
		cursor: 'pointer',
		display: 'flex',
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	topicButtonSelected: {
		color: colors.textLinkActive,
	},
})

type MoveTopicLinkProps = TopicWithChildren & {
	onSelect: (topicId: Id<'topics'>) => void
	selectedTopicId: Id<'topics'>
}

export function MoveTopicLink({
	_id,
	title,
	childTopics,
	onSelect,
	selectedTopicId,
}: MoveTopicLinkProps) {
	const topicTitle = title.trim() || 'Untitled'
	const [isExpanded, setIsExpanded] = useState(true)
	const hasChildren = childTopics.length > 0
	const isSelected = selectedTopicId === _id
	const childrenId = `move-topic-${_id}-children`

	const handleExpandedChange = useCallback(() => {
		setIsExpanded(expanded => !expanded)
	}, [])

	return (
		<li {...stylex.props(styles.container)}>
			<div
				{...stylex.props(styles.row, isSelected && styles.rowSelected)}
			>
				{hasChildren ? (
					<Button.Icon
						aria-controls={childrenId}
						aria-expanded={isExpanded}
						aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${topicTitle}`}
						shape='round'
						size='micro'
						variant='ghost'
						onClick={handleExpandedChange}
					>
						<ChevronRight
							aria-hidden='true'
							size={iconSizes.md}
							{...stylex.props(
								styles.chevron,
								isExpanded && styles.chevronExpanded,
							)}
						/>
					</Button.Icon>
				) : (
					<span
						aria-hidden='true'
						{...stylex.props(styles.togglePlaceholder)}
					/>
				)}
				<button
					type='button'
					aria-pressed={isSelected}
					{...stylex.props(
						styles.topicButton,
						isSelected && styles.topicButtonSelected,
					)}
					onClick={() => onSelect(_id)}
				>
					{topicTitle}
				</button>
			</div>

			{hasChildren ? (
				<ul
					id={childrenId}
					hidden={!isExpanded}
					{...stylex.props(
						styles.childrenList,
						!isExpanded && styles.childrenListCollapsed,
					)}
				>
					{childTopics.map(child => (
						<MoveTopicLink
							key={child._id}
							{...child}
							onSelect={onSelect}
							selectedTopicId={selectedTopicId}
						/>
					))}
				</ul>
			) : null}
		</li>
	)
}
