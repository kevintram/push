import type { Collection } from '@convex/validators/collections'
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

export function ReviewDialogCollectionOverflowMenu({
	collections,
}: {
	collections: Array<Collection>
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label='Show collection path'
						iconOnly
						size='small'
						variant='ghost'
					>
						<BreadcrumbEllipsis />
					</Button>
				}
			/>
			<DropdownMenuContent align='start'>
				<DropdownMenuGroup>
					{collections.map(collection => (
						<DialogClose
							key={collection._id}
							nativeButton={false}
							render={
								<DropdownMenuItem
									render={
										<Link
											to='/collection/$collectionId'
											params={{
												collectionId: collection._id,
											}}
											{...stylex.props(styles.link)}
										/>
									}
								/>
							}
						>
							{formatBreadcrumbLabel(collection.title)}
						</DialogClose>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
