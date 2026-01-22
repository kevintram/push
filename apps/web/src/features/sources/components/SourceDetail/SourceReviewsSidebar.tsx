import { use } from 'react'
import { LearnableReviewsSidebar } from '~/components/LearnableReviewsSidebar'
import { SourceContext } from '../../stores/SelectedSourceContext'

interface SourceReviewsSidebarProps {
	readonly?: boolean
}

export function SourceReviewsSidebar({
	readonly = false
}: SourceReviewsSidebarProps) {
	const { source } = use(SourceContext)

	return (
		<LearnableReviewsSidebar
			entity={source}
			entityType='source'
			readonly={readonly}
		/>
	)
}
