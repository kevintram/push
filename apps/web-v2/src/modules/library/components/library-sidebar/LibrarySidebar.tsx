import * as stylex from '@stylexjs/stylex'

import topics from '~/modules/library/mock-data/topics.json'
import { spacing } from '~/styles/tokens.stylex'

import type { Topic } from '../../types/topic.types'
import { TopicLink } from './TopicLink'

const styles = stylex.create({
	container: {
		padding: spacing.md,

		overflow: 'hidden',

		flexShrink: 0,
		inlineSize: '240px',

		height: '100%',
	},
	list: {
		margin: 0,
		padding: 0,

		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		listStyleType: 'none',
	},
})

export function LibrarySidebar() {
	return (
		<nav aria-label='Library topics' {...stylex.props(styles.container)}>
			<ul {...stylex.props(styles.list)}>
				{(topics as Array<Topic>).map(topic => (
					<TopicLink key={topic.id} {...topic} />
				))}
			</ul>
		</nav>
	)
}
