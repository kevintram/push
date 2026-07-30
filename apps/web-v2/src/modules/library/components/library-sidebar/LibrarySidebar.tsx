import { api } from '@convex/_generated/api'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from 'convex/react'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import { fontWeights, iconSizes, spacing } from '~/styles/tokens.stylex'

import { TopicLink } from './TopicLink'

const styles = stylex.create({
	container: { overflowY: 'auto' },
	header: {
		padding: spacing.md,
		display: 'flex',
		paddingBlockEnd: spacing.none,
	},
	headerText: {
		paddingInline: spacing.sm,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontWeight: fontWeights.semibold,
	},
	nav: {
		padding: spacing.md,
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
	const topics = useQuery(api.topics.get)

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.headerText)}>Library</p>
				<Button.Icon
					aria-label='Add topic'
					disabled
					shape='round'
					size='micro'
					variant='ghost'
				>
					<Plus aria-hidden='true' size={iconSizes.md} />
				</Button.Icon>
			</div>
			<nav aria-label='Library topics' {...stylex.props(styles.nav)}>
				<ul {...stylex.props(styles.list)}>
					{topics?.map(topic => (
						<TopicLink key={topic._id} {...topic} />
					))}
				</ul>
			</nav>
		</div>
	)
}
