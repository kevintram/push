import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { colors, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { type Topic } from '../../types/topic.types'

type TopicLinkProps = Topic

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
