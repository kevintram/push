import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { useDraggable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { useCreateTopic, useDeleteTopic } from '../../api/topicQueries'
import { type TopicWithChildren } from '../../types/topic.types'

const topicPointerSensor = PointerSensor.configure({
	// sensor configuration so links can still be clicked while we do drag and drop
	activationConstraints(event) {
		if (event.pointerType === 'touch') {
			return [
				new PointerActivationConstraints.Delay({
					value: 250,
					tolerance: 5,
				}),
			]
		}

		return [new PointerActivationConstraints.Distance({ value: 6 })]
	},
})

const styles = stylex.create({
	// TODO: fix these damn color tokens
	container: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',

		borderRadius: radii.lg,
	},
	containerDragging: {
		backgroundColor: colors.navBgSurface,
	},
	row: {
		borderRadius: radii.lg,
		gap: spacing.xs,

		alignItems: 'center',
		backgroundColor: {
			default: 'inherit',
			':hover': colors.navBgSurfaceHover,
		},
		display: 'grid',
		gridTemplateColumns: '26px minmax(0, 1fr)',
	},
	rowActive: {
		backgroundColor: {
			default: colors.navBgSurfaceActive,
			':hover': colors.navBgSurfaceActive,
		},
	},
	togglePlaceholder: {
		blockSize: '26px',
		inlineSize: '26px',
	},
	chevron: {
		transform: 'rotate(0deg)',
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
	},
	chevronExpanded: {
		transform: 'rotate(90deg)',
	},
	childrenList: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		margin: 0,
		paddingBlock: 0,
		listStyleType: 'none',
		paddingInlineEnd: 0,
		paddingInlineStart: spacing.md,
	},
	childrenListCollapsed: {
		display: 'none',
	},
	topicLink: {
		padding: spacing.xs,
		textDecoration: 'none',

		alignItems: 'center',
		color: {
			'[data-status=active]': colors.textLinkActive,
			default: colors.textLink,
			':hover': colors.textLinkHover,
		},
		display: 'flex',
		fontSize: fontSizes.sm,
	},
})

export function TopicLink({ _id, title, childTopics }: TopicWithChildren) {
	const topicTitle = title.trim() || 'Untitled'
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()
	const createTopic = useCreateTopic()
	const deleteTopic = useDeleteTopic()
	const [isExpanded, setIsExpanded] = useState(true)
	const hasChildren = childTopics.length > 0
	const childrenId = `topic-${_id}-children`

	const {
		ref: draggableElementRef,
		handleRef: draggableHandleRef,
		isDragging,
	} = useDraggable({
		id: `draggable-topic-${_id}`,
		sensors: [topicPointerSensor],
	})

	// Combined ref for both `draggableElementRef` and `draggableHandleRef`.
	// 
	// Need both because dnd-kit won't allow drag on interactive element unless
	// it uses handleRef and you just need draggableElementRef mark what you're 
	// actually dragging.
	const combinedDraggableRef = useCallback((element: HTMLElement | null) => {
		draggableElementRef(element)
		draggableHandleRef(element)
	}, [draggableElementRef, draggableHandleRef])

	const isActive = Boolean(
		matchRoute({
			to: '/library/$topicId',
			params: { topicId: _id },
			fuzzy: false,
			includeSearch: true,
		}),
	)

	const handleCreateSubtopic = useCallback(() => {
		createTopic.mutate(
			{ parentId: _id },
			{
				onSuccess: topicId =>
					navigate({ to: '/library/$topicId', params: { topicId } }),
			},
		)
	}, [navigate, createTopic, _id])

	const handleDeleteTopic = useCallback(() => {
		deleteTopic.mutate({ topicId: _id })
	}, [_id, deleteTopic])

	const handleExpandedChange = useCallback(() => {
		setIsExpanded(expanded => !expanded)
	}, [])

	return (
		<li
			{...stylex.props(
				styles.container,
				isDragging && styles.containerDragging,
			)}
			ref={combinedDraggableRef}
		>
			<div {...stylex.props(styles.row, isActive && styles.rowActive)}>
				{hasChildren ? (
					<Button.Icon
						aria-controls={childrenId}
						aria-expanded={isExpanded}
						aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${topicTitle}`}
						shape='round'
						size='micro'
						variant='ghost'
						onClick={handleExpandedChange}
					>
						<ChevronRight
							aria-hidden='true'
							size={iconSizes.md}
							{...stylex.props(
								styles.chevron,
								isExpanded && styles.chevronExpanded,
							)}
						/>
					</Button.Icon>
				) : (
					<span
						aria-hidden='true'
						{...stylex.props(styles.togglePlaceholder)}
					/>
				)}
				<ContextMenu>
					<ContextMenuTrigger
						render={
							<Link
								to='/library/$topicId'
								params={{ topicId: _id }}
								activeOptions={{ exact: true }}
								aria-label={topicTitle}
								{...stylex.props(styles.topicLink)}
							/>
						}
					>
						{topicTitle}
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem onClick={handleCreateSubtopic}>
							<Plus aria-hidden='true' size={iconSizes.md} />
							Add subtopic
						</ContextMenuItem>
						<ContextMenuItem onClick={handleDeleteTopic}>
							<Trash2 aria-hidden='true' size={iconSizes.md} />
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</div>

			{hasChildren ? (
				<ul
					id={childrenId}
					hidden={!isExpanded}
					{...stylex.props(
						styles.childrenList,
						!isExpanded && styles.childrenListCollapsed,
					)}
				>
					{childTopics.map(child => (
						<TopicLink key={child._id} {...child} />
					))}
				</ul>
			) : null}
		</li>
	)
}
