import type { Topic } from '@convex/validators/topics'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	BreadcrumbEllipsis,
	Button,
	DialogClose,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'

const styles = stylex.create({
	link: {
		textDecoration: 'none',
	},
})

function formatBreadcrumbLabel(value: string) {
	return value.trim() || 'Untitled'
}

export function ReviewDialogTopicOverflowMenu({
	topics,
}: {
	topics: Array<Topic>
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button.Icon
						aria-label='Show topic path'
						size='small'
						variant='ghost'
					>
						<BreadcrumbEllipsis />
					</Button.Icon>
				}
			/>
			<DropdownMenuContent align='start'>
				<DropdownMenuGroup>
					{topics.map(topic => (
						<DialogClose
							key={topic._id}
							nativeButton={false}
							render={
								<DropdownMenuItem
									render={
										<Link
											to='/library/$topicId'
											params={{ topicId: topic._id }}
											{...stylex.props(styles.link)}
										/>
									}
								/>
							}
						>
							{formatBreadcrumbLabel(topic.title)}
						</DialogClose>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
