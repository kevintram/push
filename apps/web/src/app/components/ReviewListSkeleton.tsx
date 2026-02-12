import { PageLayout } from '~/app/layouts/PageLayout'
import { LoadingSpinner } from '~/components/ui/loading-spinner'

export function ReviewListSkeleton() {
	return (
		<PageLayout.Content>
			<LoadingSpinner containerClassName='min-h-64' />
		</PageLayout.Content>
	)
}
