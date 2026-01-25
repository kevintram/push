import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, FileText } from 'lucide-react'
import { useCallback } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card'
import { Skeleton } from '~/components/ui/Skeleton'
import { usePracticeWithRelationships } from '~/features/practices/api/getPractice'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'

interface PracticeDetailPageProps {
	practiceId: string
}

function BrowserNavigationButtons() {
	const router = useRouter()

	return (
		<Button
			className='h-6 w-6 p-0'
			onClick={() => router.history.back()}
			size='sm'
			title='Go back'
			variant='ghost'
		>
			<ArrowLeft className='h-4 w-4' />
		</Button>
	)
}

export function PracticeDetailPage({ practiceId }: PracticeDetailPageProps) {
	const navigate = useNavigate()
	const router = useRouter()

	const { practice, isLoading } = usePracticeWithRelationships(
		Number.parseInt(practiceId, 10)
	)

	const handleDelete = useCallback(() => {
		router.history.back()
	}, [router])

	const handleTopicNavigate = useCallback(
		(topicId: number) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topicId.toString() }
			})
		},
		[navigate]
	)

	const handleSourceNavigate = useCallback(
		(sourceId: number) => {
			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: sourceId.toString() }
			})
		},
		[navigate]
	)

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Content className='mx-auto max-w-5xl p-6'>
					<Card>
						<CardHeader>
							<Skeleton className='h-8 w-48' />
						</CardHeader>
						<CardContent className='space-y-4'>
							<Skeleton className='h-20 w-full' />
							<Skeleton className='h-20 w-full' />
						</CardContent>
					</Card>
				</PageLayout.Content>
			</PageLayout>
		)
	}

	if (!practice) {
		return (
			<PageLayout>
				<PageLayout.Content className='mx-auto max-w-5xl p-6'>
					<Card>
						<CardContent className='py-8 text-center text-muted-foreground'>
							Practice not found
						</CardContent>
					</Card>
				</PageLayout.Content>
			</PageLayout>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={FileText} title='Practice'>
				<div className='flex items-center gap-2'>
					<BrowserNavigationButtons />
					<PracticeActionMenu onDelete={handleDelete} practice={practice} />
				</div>
			</PageLayout.Header>
			<PageLayout.Content className='mx-auto max-w-5xl p-6'>
				<Card>
					<CardHeader>
						<CardTitle className='text-lg'>Prompt</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='whitespace-pre-wrap'>
							{practice.prompt || 'No prompt'}
						</p>
					</CardContent>
				</Card>

				<Card className='mt-4'>
					<CardHeader>
						<CardTitle className='text-lg'>Answer</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='whitespace-pre-wrap'>
							{practice.answer || 'No answer'}
						</p>
					</CardContent>
				</Card>

				{/* Related Topics */}
				{practice.topics && practice.topics.length > 0 && (
					<Card className='mt-4'>
						<CardHeader>
							<CardTitle className='text-lg'>Related Topics</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex flex-wrap gap-2'>
								{practice.topics.map(topic => (
									<Button
										key={topic.id}
										onClick={() => handleTopicNavigate(topic.id)}
										size='sm'
										variant='outline'
									>
										{topic.name || 'Untitled Topic'}
									</Button>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Related Sources */}
				{practice.sources && practice.sources.length > 0 && (
					<Card className='mt-4'>
						<CardHeader>
							<CardTitle className='text-lg'>Related Sources</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex flex-wrap gap-2'>
								{practice.sources.map(source => (
									<Button
										key={source.id}
										onClick={() => handleSourceNavigate(source.id)}
										size='sm'
										variant='outline'
									>
										{source.title || 'Untitled Source'}
									</Button>
								))}
							</div>
						</CardContent>
					</Card>
				)}
			</PageLayout.Content>
		</PageLayout>
	)
}
