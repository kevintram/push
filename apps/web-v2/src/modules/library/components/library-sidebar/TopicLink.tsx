import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { colors, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { type TopicWithChildren } from '../../types/topic.types'

type TopicLinkProps = TopicWithChildren

const styles = stylex.create({
	item: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',
	},
	link: {
		borderRadius: radii.md,

		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		textDecoration: 'none',

		backgroundColor: {
			'[data-status=active]': colors.surfaceActive,
			':hover': colors.surfaceActive,
		},

		color: 'inherit',
		display: 'block',

		fontSize: fontSizes.sm,
	},
	children: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		paddingInlineStart: spacing.md,
	},
})

export function TopicLink({ id, title, children }: TopicLinkProps) {
	return (
		<li {...stylex.props(styles.item)}>
			<Link
				to='/library/$topicId'
				params={{ topicId: String(id) }}
				{...stylex.props(styles.link)}
			>
				{title}
			</Link>

			{children && children.length > 0 ? (
				<ul {...stylex.props(styles.children)}>
					{children.map(child => (
						<TopicLink key={child.id} {...child} />
					))}
				</ul>
			) : null}
		</li>
	)
}
