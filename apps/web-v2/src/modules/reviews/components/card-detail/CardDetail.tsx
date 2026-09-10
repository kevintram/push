import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { CardActions } from '../CardActions'
import { ReviewComposerProvider } from '../ReviewComposerProvider'
import { CardBreadcrumbs } from './CardBreadcrumbs'
import { CardOverview } from './CardOverview'
import { CardReviews } from './CardReviews'
import { CardSidebar } from './CardSidebar'

export type CardTab = 'overview' | 'reviews'

type CardDetailBaseProps = {
	cardId: Id<'cards'>
	activeTab: CardTab
	/** Called when an internal breadcrumb link is about to navigate. */
	onNavigate?: () => void
}

type CardDetailProps = CardDetailBaseProps &
	(
		| {
				onTabChange: (tab: CardTab) => void
				tabLinks?: never
		  }
		| {
				onTabChange?: never
				tabLinks: Record<CardTab, ReactElement>
		  }
	)

const styles = stylex.create({
	container: {
		blockSize: '100%',
		inlineSize: '100%',

		display: 'flex',
		flexDirection: 'column',

		overflow: 'hidden',
	},
	toolbar: {
		gap: spacing.md,
		paddingBlock: spacing.sm,
		paddingInline: spacing.lg,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
	},
	breadcrumbs: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
	tabsContainer: {
		paddingInline: spacing.lg,
		flexShrink: 0,
		marginInlineStart: `calc(${spacing.sm} * -1)`,
	},
	tabs: {
		backgroundColor: semanticColors.surfaceTransparent,
	},
	content: {
		gap: spacing.lg,
		overflow: 'hidden',
		paddingInline: spacing.lg,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		paddingBlockEnd: spacing.lg,
		minHeight: 0,
		minWidth: 0,
	},
})

export function CardDetail({
	cardId,
	activeTab,
	onTabChange,
	tabLinks,
	onNavigate,
}: CardDetailProps) {
	const { data: card } = useSuspenseQuery(cardQueries.detail(cardId))
	const today = useToday()
	const srsState = deriveCardSrsState(card, today)

	return (
		<ReviewComposerProvider cardId={cardId} key={cardId}>
			<div {...stylex.props(styles.container)}>
				<header {...stylex.props(styles.toolbar)}>
					<div {...stylex.props(styles.breadcrumbs)}>
						<CardBreadcrumbs
							primaryText={card.primaryText}
							collectionId={card.collectionId}
							onNavigate={onNavigate}
						/>
					</div>
					<CardActions card={card} />
				</header>
				<Tabs
					value={activeTab}
					onValueChange={value => {
						if (
							onTabChange &&
							(value === 'overview' || value === 'reviews')
						) {
							onTabChange(value)
						}
					}}
					xstyle={styles.tabsContainer}
				>
					<TabsList aria-label='Card sections' xstyle={styles.tabs}>
						<TabsTrigger
							value='overview'
							nativeButton={tabLinks ? false : undefined}
							render={tabLinks?.overview}
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value='reviews'
							nativeButton={tabLinks ? false : undefined}
							render={tabLinks?.reviews}
						>
							Reviews
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<div {...stylex.props(styles.content)}>
					{activeTab === 'overview' ? (
						<CardOverview cardId={cardId} />
					) : (
						<CardReviews cardId={cardId} />
					)}
					<CardSidebar
						{...srsState}
						cardId={cardId}
						showReviews={activeTab === 'overview'}
						today={today}
					/>
				</div>
			</div>
		</ReviewComposerProvider>
	)
}
