import type { Section } from '@convex/validators/sections'
import * as stylex from '@stylexjs/stylex'
import { Ellipsis } from 'lucide-react'
import { useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import {
	useConvertSectionToCollection,
	useDeleteSection,
} from '~/modules/collections/api/sectionQueries'
import { MoveSectionDialog } from '~/modules/collections/components/MoveSectionDialog'
import { iconSizes, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// A short, wide pill that sits on the title's line, as in Things, rather
	// than a full-height button towering over the title. The margin centers it
	// on the column labels' 21px line, which ends at the bottom of the row, so
	// its dots line up with the labels beside it.
	trigger: {
		borderRadius: radii.xs,

		aspectRatio: 'auto',
		blockSize: '20px',
		inlineSize: '28px',
		marginBlockEnd: '0.5px',
	},
})

type SectionActionsProps = {
	section: Section
}

/** The "more" menu in a section's header. */
export function SectionActions({ section }: SectionActionsProps) {
	const convertSection = useConvertSectionToCollection()
	const deleteSection = useDeleteSection()
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const confirmDelete = () => {
		deleteSection.mutate(
			{ sectionId: section._id },
			// Leave the dialog open on failure so the toast has context.
			{ onSuccess: () => setIsDeleteDialogOpen(false) },
		)
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label='Section actions'
							iconOnly
							size='small'
							variant='ghost'
							xstyle={styles.trigger}
						/>
					}
				>
					<Ellipsis aria-hidden='true' size={iconSizes.sm} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
						Move
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={convertSection.isPending}
						onClick={() =>
							convertSection.mutate({ sectionId: section._id })
						}
					>
						Convert to subcollection
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{isMoveDialogOpen ? (
				<MoveSectionDialog
					onOpenChange={setIsMoveDialogOpen}
					section={section}
				/>
			) : null}

			<DeleteConfirmationDialog
				description='This section, its cards, and their review history will be permanently deleted.'
				isPending={deleteSection.isPending}
				onConfirm={confirmDelete}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title={`Delete ${section.title ? `"${section.title}"` : 'section'}?`}
			/>
		</>
	)
}
