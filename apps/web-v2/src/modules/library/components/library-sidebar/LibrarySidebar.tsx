import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'

import { spacing } from '~/styles/tokens.stylex'

import { topicQueries } from '../../api/queries'
import { TopicLink } from './TopicLink'

const styles = stylex.create({
	container: {
		padding: spacing.md,

		overflowY: 'auto',

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
	const { data } = useQuery(topicQueries.list())

	return (
		<nav aria-label='Library topics' {...stylex.props(styles.container)}>
			<ul {...stylex.props(styles.list)}>
				{data?.map(topic => (
					<TopicLink key={topic.id} {...topic} />
				))}
			</ul>
		</nav>
	)
}
