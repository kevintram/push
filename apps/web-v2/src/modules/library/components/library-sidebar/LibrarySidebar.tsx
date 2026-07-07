import * as stylex from '@stylexjs/stylex'

import topics from '~/modules/library/mock-data/topics.json'
import { spacing } from '~/styles/tokens.stylex'

import type { Topic } from '../../types/topic.types'
import { TopicLink } from './TopicLink'

const styles = stylex.create({
	container: {
		height: '100%',
		overflow: 'hidden',

		inlineSize: '240px',
		flexShrink: 0,
		padding: spacing.md,
	},
	list: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
		margin: 0,
		padding: 0,
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
