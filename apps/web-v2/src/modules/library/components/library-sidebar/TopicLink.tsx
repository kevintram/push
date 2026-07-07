import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { colors, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { type Topic } from '../../types/topic.types'

type TopicLinkProps = Topic

const styles = stylex.create({
	item: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
	},
	link: {
		display: 'block',
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		borderRadius: radii.md,

		color: 'inherit',
		fontSize: fontSizes.sm,
		textDecoration: 'none',

		backgroundColor: {
			':hover': colors.surfaceActive,
			'[data-status=active]': colors.surfaceActive,
		},
	},
	children: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
		paddingInlineStart: spacing.md,
	},
})

export function TopicLink({ slug, title, children }: TopicLinkProps) {
	return (
		<li {...stylex.props(styles.item)}>
			<Link
				to='/library/$topicId'
				params={{ topicId: slug }}
				{...stylex.props(styles.link)}
			>
				{title}
			</Link>

			{children.length > 0 ? (
				<ul {...stylex.props(styles.children)}>
					{children.map(child => (
						<TopicLink key={child.id} {...child} />
					))}
				</ul>
			) : null}
		</li>
	)
}
