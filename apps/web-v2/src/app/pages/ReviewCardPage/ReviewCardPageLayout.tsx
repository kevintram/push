import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
	Link,
	Outlet,
	useLoaderData,
	useMatchRoute,
	useParams,
} from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { topicQueries } from '~/modules/library/api/queries'
import { colors } from '~/styles/colors.stylex'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	outerContainer: {
		blockSize: '100%',
		inlineSize: '100%',

		display: 'flex',
		flexDirection: 'column',

		padding: spacing.sm,

		overflow: 'hidden',
	},
	header: {
		display: 'flex',

		gap: spacing.sm,
		alignItems: 'center',
	},
	tabs: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	link: {
		display: 'flex',

		gap: spacing.sm,

		textDecoration: 'none',
		color: {
			default: colors.textLink,
			':hover': colors.textLinkHover,
			':active': colors.textLinkActive,
		},
	},
	tabLink: {
		textDecoration: 'none',
	},
})

export function ReviewCardPageLayout() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const { topicId } = useLoaderData({
		from: '/review-cards/$reviewCardId',
	})

	const { data: topic } = useSuspenseQuery(topicQueries.detail(topicId))

	const matchRoute = useMatchRoute()
	const activeTab = matchRoute({
		to: '/review-cards/$reviewCardId/reviews',
		params: { reviewCardId },
	})
		? 'review'
		: 'overview'

	return (
		<div {...stylex.props(styles.outerContainer)}>
			<header {...stylex.props(styles.header)}>
				<Tabs value={activeTab} xstyle={styles.tabs}>
					<Link
						to='/library/$topicId'
						params={{ topicId }}
						{...stylex.props(styles.link)}
					>
						<ArrowLeft />
						{topic.title}
					</Link>
					<TabsList aria-label='Review card sections'>
						<TabsTrigger
							value='overview'
							nativeButton={false}
							render={
								<Link
									to='/review-cards/$reviewCardId'
									params={{ reviewCardId }}
									{...stylex.props(styles.tabLink)}
								/>
							}
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value='review'
							nativeButton={false}
							render={
								<Link
									to='/review-cards/$reviewCardId/reviews'
									params={{ reviewCardId }}
									{...stylex.props(styles.tabLink)}
								/>
							}
						>
							Review
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</header>
			<Outlet />
		</div>
	)
}
