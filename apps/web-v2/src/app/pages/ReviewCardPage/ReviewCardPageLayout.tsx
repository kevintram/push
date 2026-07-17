import * as stylex from '@stylexjs/stylex'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Link,
	Outlet,
	useMatchRoute,
	useNavigate,
	useParams,
} from '@tanstack/react-router'
import { ArrowLeft, Ellipsis, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Tabs,
	TabsList,
	TabsTrigger,
} from '~/components/ui'
import { topicQueries } from '~/modules/library/api/queries'
import { useDeleteReviewCard } from '~/modules/reviews/api/deleteReviewCard'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	outerContainer: {
		padding: spacing.lg,
		width: '100%',
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

		textDecoration: {
			default: 'none',
			':hover': 'underline',
		},
		color: 'inherit',
	},
	tabLink: {
		textDecoration: 'none',
	},
})

export function ReviewCardPageLayout() {
	const { reviewCardId, topicId } = useParams({
		from: '/library/$topicId_/$reviewCardId',
	})

	const { data: topic } = useQuery(topicQueries.detail(topicId))
	const queryClient = useQueryClient()
	const { isPending: isDeleting, mutateAsync: deleteReviewCard } =
		useDeleteReviewCard()
	const navigate = useNavigate()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const matchRoute = useMatchRoute()
	const activeTab = matchRoute({
		to: '/library/$topicId/$reviewCardId/review',
		params: { reviewCardId, topicId },
	})
		? 'review'
		: 'overview'

	const confirmDelete = async () => {
		try {
			await deleteReviewCard(reviewCardId)
			setIsDeleteDialogOpen(false)
			await navigate({
				to: '/library/$topicId',
				params: { topicId },
			})
			queryClient.removeQueries({
				queryKey: reviewCardQueries.detail(reviewCardId).queryKey,
			})
		} catch {
			toast.error('Failed to delete review card')
		}
	}

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
						{topic?.title}
					</Link>
					<TabsList aria-label='Review card sections'>
						<TabsTrigger
							value='overview'
							nativeButton={false}
							render={
								<Link
									to='/library/$topicId/$reviewCardId'
									params={{ reviewCardId, topicId }}
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
									to='/library/$topicId/$reviewCardId/review'
									params={{ reviewCardId, topicId }}
									{...stylex.props(styles.tabLink)}
								/>
							}
						>
							Review
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label='Review card actions'
								variant='ghost'
							/>
						}
					>
						<Ellipsis aria-hidden='true' />
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuItem
							disabled={isDeleting}
							variant='destructive'
							onClick={() => setIsDeleteDialogOpen(true)}
						>
							<Trash2 aria-hidden='true' size={16} />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>
			<Outlet />
			<DeleteConfirmationDialog
				description='This will delete this review card and all linked reviews.'
				isPending={isDeleting}
				onConfirm={() => void confirmDelete()}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete review card?'
			/>
		</div>
	)
}
