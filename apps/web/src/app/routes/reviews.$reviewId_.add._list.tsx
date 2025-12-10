import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { Archive, History, Home, Inbox } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { useNavigation } from '~/features/reviews/components/AddTopicToReviewDialog/useNavigation'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/reviews/$reviewId_/add/_list')({
	component: ListLayout
})

function NavigationBadges() {
	const location = useLocation()
	const {
		navigateToHome,
		navigateToRecent,
		navigateToInbox,
		navigateToArchived
	} = useNavigation()

	const isActive = (path: string) => {
		if (path === '/add') {
			return location.pathname.endsWith('/add')
		}
		return location.pathname.endsWith(path)
	}

	return (
		<div className={cn('mb-4 flex gap-2')}>
			<Badge
				onClick={navigateToHome}
				variant={isActive('/add') ? 'default' : 'secondary'}
			>
				<Home className='h-4 w-4' />
				Home
			</Badge>
			<Badge
				onClick={navigateToRecent}
				variant={isActive('/recent') ? 'default' : 'secondary'}
			>
				<History className='h-4 w-4' />
				Recent
			</Badge>
			<Badge
				onClick={navigateToInbox}
				variant={isActive('/inbox') ? 'default' : 'secondary'}
			>
				<Inbox className='h-4 w-4' />
				Inbox
			</Badge>
			<Badge
				onClick={navigateToArchived}
				variant={isActive('/archived') ? 'default' : 'secondary'}
			>
				<Archive className='h-4 w-4' />
				Archived
			</Badge>
		</div>
	)
}

function ListLayout() {
	return (
		<div className='p-6 pt-4'>
			<NavigationBadges />
			<Outlet />
		</div>
	)
}
