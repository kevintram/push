import { createFileRoute } from '@tanstack/react-router'
import {
	ArchiveRestore,
	Baby,
	ChevronDown,
	PanelLeft,
	PanelRight,
	RotateCcw,
	Sprout,
	Star,
	User,
	UserPlus,
	Users
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PracticeNotesPanel } from '~/components/PracticeNotesPanel'
import { ResizableSidebar } from '~/components/ResizableSidebar'
import { ReviewSidebar } from '~/components/ReviewSidebar'
import { TopicFamilyPanel } from '~/components/TopicFamilyPanel'
import { TopicListSidebar } from '~/components/TopicListSidebar'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { cn } from '~/lib/utils'
import type { Topic, TopicMap } from '~/types/topic-hub'

export const Route = createFileRoute('/')({
	component: TopicHub
})

// Mock data with new structure
const mockTopicMap: TopicMap = {
	'1': {
		id: '1',
		title: 'Introduction to Neural Networks',
		subtitle: 'Basic concepts and architecture',
		notes: 'Core concepts of neural networks including perceptrons, layers, and basic architectures.',
		createdAt: new Date('2024-01-15'),
		lastReviewedAt: new Date('2024-01-28'),
		stability: 62,
		retrievability: 85,
		parentIds: ['5'],
		childIds: ['2', '3', '4', '7'],
		practiceItems: [
			{ id: 'p1', title: 'What are the key components of a neural network?' },
			{ id: 'p2', title: 'Explain forward propagation' }
		],
		reviewHistory: [
			{
				date: new Date('2025-07-26'),
				retrievabilityAtTheTime: 70,
				stabilityAtTheTime: 62,
				stabilityBefore: 45,
				stabilityAfter: 62,
				practiceItemsReviewed: ['p1', 'p2']
			},
			{
				date: new Date('2025-07-28'),
				retrievabilityAtTheTime: 70,
				stabilityAtTheTime: 68,
				stabilityBefore: 62,
				stabilityAfter: 68,
				practiceItemsReviewed: ['p1', 'p2']
			}
		],
		parentTitles: ['Deep Learning Fundamentals'],
		childTitles: ['Linear Algebra', 'Multivariate Calculus', 'Intro to Statistics', 'Activation Functions'],
		daysSinceLastReview: 2,
		daysSinceCreated: 15
	},
	'2': {
		id: '2',
		title: 'Linear Algebra',
		subtitle: 'Mathematical foundations',
		notes: 'Vector operations, matrix multiplication, eigenvalues and eigenvectors.',
		createdAt: new Date('2024-01-10'),
		lastReviewedAt: new Date('2024-01-25'),
		stability: 120,
		retrievability: 92,
		parentIds: ['1'],
		childIds: [],
		practiceItems: [
			{ id: 'p3', title: 'Matrix multiplication examples' }
		],
		reviewHistory: [],
		parentTitles: ['Introduction to Neural Networks'],
		childTitles: [],
		daysSinceLastReview: 5,
		daysSinceCreated: 20
	},
	'3': {
		id: '3',
		title: 'Multivariate Calculus',
		subtitle: 'Derivatives and optimization',
		notes: 'Partial derivatives, gradients, chain rule applications.',
		createdAt: new Date('2024-01-30'),
		lastReviewedAt: null,
		stability: 0,
		retrievability: 45,
		parentIds: ['1'],
		childIds: [],
		practiceItems: [
			{ id: 'p4', title: 'Calculate partial derivatives' }
		],
		reviewHistory: [],
		parentTitles: ['Introduction to Neural Networks'],
		childTitles: [],
		daysSinceLastReview: 0,
		daysSinceCreated: 0
	},
	'4': {
		id: '4',
		title: 'Intro to Statistics',
		subtitle: 'Probability and distributions',
		notes: 'Basic probability, normal distribution, statistical inference.',
		createdAt: new Date('2024-01-30'),
		lastReviewedAt: null,
		stability: 15,
		retrievability: 68,
		parentIds: ['1'],
		childIds: [],
		practiceItems: [],
		reviewHistory: [],
		parentTitles: ['Introduction to Neural Networks'],
		childTitles: [],
		daysSinceLastReview: 0,
		daysSinceCreated: 0
	},
	'5': {
		id: '5',
		title: 'Deep Learning Fundamentals',
		subtitle: 'Advanced neural network concepts',
		notes: 'Deep architectures, training strategies, regularization techniques.',
		createdAt: new Date('2024-01-01'),
		lastReviewedAt: new Date('2024-01-23'),
		stability: 180,
		retrievability: 76,
		parentIds: [],
		childIds: ['1', '6'],
		practiceItems: [
			{ id: 'p5', title: 'Explain deep vs shallow networks' }
		],
		reviewHistory: [],
		parentTitles: [],
		childTitles: ['Introduction to Neural Networks', 'Backpropagation'],
		daysSinceLastReview: 7,
		daysSinceCreated: 29
	},
	'6': {
		id: '6',
		title: 'Backpropagation',
		subtitle: 'Gradient descent algorithm',
		notes: 'Chain rule application, gradient computation, weight updates.',
		createdAt: new Date('2024-01-20'),
		lastReviewedAt: new Date('2024-01-27'),
		stability: 45,
		retrievability: 88,
		parentIds: ['5', '1'],
		childIds: [],
		practiceItems: [
			{ id: 'p6', title: 'Derive backpropagation equations' }
		],
		reviewHistory: [],
		parentTitles: ['Deep Learning Fundamentals', 'Introduction to Neural Networks'],
		childTitles: [],
		daysSinceLastReview: 3,
		daysSinceCreated: 10
	},
	'7': {
		id: '7',
		title: 'Activation Functions',
		subtitle: 'Non-linear transformations',
		notes: 'ReLU, sigmoid, tanh, and their properties.',
		createdAt: new Date('2024-01-25'),
		lastReviewedAt: new Date('2024-01-29'),
		stability: 90,
		retrievability: 78,
		parentIds: ['1'],
		childIds: [],
		practiceItems: [
			{ id: 'p7', title: 'Compare different activation functions' }
		],
		reviewHistory: [],
		parentTitles: ['Introduction to Neural Networks'],
		childTitles: [],
		daysSinceLastReview: 1,
		daysSinceCreated: 5
	}
}

// Convert TopicMap to array for sidebar
const mockTopics: Topic[] = Object.values(mockTopicMap)

// Get initial selected topic
const mockSelectedTopic: Topic = mockTopicMap['1'] || mockTopics[0] || {
	id: 'default',
	title: 'Default Topic',
	subtitle: 'Default subtitle',
	notes: '',
	createdAt: new Date(),
	lastReviewedAt: null,
	stability: 0,
	retrievability: 0,
	parentIds: [],
	childIds: [],
	practiceItems: [],
	reviewHistory: [],
	parentTitles: [],
	childTitles: [],
	daysSinceLastReview: 0,
	daysSinceCreated: 0
}

// Helper function for retrievability color coding
const getRetrievabilityColor = (retrievability: number) => {
	if (retrievability >= 85) return 'text-emerald-600'
	if (retrievability >= 75) return 'text-amber-600'
	if (retrievability >= 60) return 'text-orange-600'
	return 'text-red-600'
}

function TopicHub() {
	const [selectedTopic, setSelectedTopic] = useState(mockSelectedTopic)
	const [leftSidebarWidth, setLeftSidebarWidth] = useState(288) // 18rem = 288px
	const [rightSidebarWidth, setRightSidebarWidth] = useState(288)
	const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false)
	const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
	// New state for complete hiding
	const [isLeftSidebarHidden, setIsLeftSidebarHidden] = useState(false)
	const [isRightSidebarHidden, setIsRightSidebarHidden] = useState(false)

	// Responsive behavior for sidebars
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth
			// Hide sidebars on mobile/tablet (< 1024px)
			if (width < 1024) {
				setIsLeftSidebarHidden(true)
				setIsRightSidebarHidden(true)
			} else {
				// Show sidebars on desktop by default
				setIsLeftSidebarHidden(false)
				setIsRightSidebarHidden(false)
			}
		}

		// Set initial state
		handleResize()

		// Add event listener
		window.addEventListener('resize', handleResize)

		// Cleanup
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const handleTopicSelect = useCallback((topic: Topic) => {
		setSelectedTopic(topic)
	}, [])

	const handleTopicSelectByName = useCallback((topicName: string) => {
		const foundTopic = mockTopics.find(topic => topic.title === topicName)
		if (foundTopic) {
			setSelectedTopic(foundTopic)
		}
	}, [])

	return (
		<div className='relative flex h-screen w-full'>
			{/* Left Sidebar */}
			{!isLeftSidebarHidden && (
				<ResizableSidebar
					isCollapsed={isLeftSidebarCollapsed}
					maxWidth={400}
					minWidth={200}
					onToggleCollapse={() =>
						setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)
					}
					onWidthChange={setLeftSidebarWidth}
					side='left'
					width={leftSidebarWidth}
				>
					<TopicListSidebar
						onTopicSelect={handleTopicSelect}
						selectedTopicId={selectedTopic.id}
						topics={mockTopics}
					/>
				</ResizableSidebar>
			)}

			{/* Main Content */}
			<div className='flex min-w-0 flex-1 flex-col'>
				{/* Sidebar Toggle Controls */}
				<div className='flex items-center justify-between p-2 sm:p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
					<Button
						className='h-8 w-8 sm:h-9 sm:w-9'
						onClick={() => setIsLeftSidebarHidden(!isLeftSidebarHidden)}
						size='icon'
						title={
							isLeftSidebarHidden
								? 'Show Topics Sidebar'
								: 'Hide Topics Sidebar'
						}
						variant='ghost'
					>
						<PanelLeft className='h-4 w-4' />
					</Button>
					<div className='text-xs sm:text-sm font-medium text-muted-foreground hidden sm:block'>
						Library
					</div>
					<Button
						className='h-8 w-8 sm:h-9 sm:w-9'
						onClick={() => setIsRightSidebarHidden(!isRightSidebarHidden)}
						size='icon'
						title={
							isRightSidebarHidden
								? 'Show Review Sidebar'
								: 'Hide Review Sidebar'
						}
						variant='ghost'
					>
						<PanelRight className='h-4 w-4' />
					</Button>
				</div>
				<div className='flex w-full flex-1 flex-col gap-4 sm:gap-6 overflow-auto p-3 sm:p-4 md:p-6'>
					{/* Topic Header */}
					<div className='flex w-full flex-col gap-3 sm:gap-4'>
						<div className='flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start'>
							<div className='flex flex-1 flex-col gap-2'>
								<div className='flex flex-col gap-2'>
									{/* Title and populate button row (desktop) */}
									<div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-0'>
										<h1 className='text-xl sm:text-2xl md:text-3xl font-bold sm:flex-1 sm:pr-4 leading-tight'>
											{selectedTopic.title}
										</h1>
										<div className='hidden sm:block flex-shrink-0 sm:mt-0.5'>
											<DropdownMenu>
												<DropdownMenuTrigger asChild={true}>
													<Button size='sm' variant='secondary'>
														<Baby className='h-4 w-4' />
														<span className='ml-1'>Populate</span>
														<ChevronDown className='h-4 w-4 ml-1' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent>
													<DropdownMenuItem>
														<Users className='h-4 w-4' />
														Children
													</DropdownMenuItem>
													<DropdownMenuItem>
														<UserPlus className='h-4 w-4' />
														Grandchildren
													</DropdownMenuItem>
													<DropdownMenuItem>
														<Star className='h-4 w-4' />
														All Descendants
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>

									<div className='flex flex-col gap-2 sm:flex-row sm:gap-2'>
										{/* Retrievability */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-2 cursor-help flex-shrink-0'>
													<ArchiveRestore className='h-3 w-3 sm:h-4 sm:w-4' />
													<p className='text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap'>
														<span
															className={cn(
																getRetrievabilityColor(
																	selectedTopic.retrievability
																)
															)}
														>
															{selectedTopic.retrievability}%
														</span>{' '}
														retrievability
													</p>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Retrievability</p>
											</TooltipContent>
										</Tooltip>

										<span className='hidden sm:inline font-bold'> · </span>

										{/* Last Reviewed */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-2 cursor-help flex-shrink-0'>
													<RotateCcw className='h-3 w-3 sm:h-4 sm:w-4' />
													<span className='text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap'>
														Last reviewed {selectedTopic.daysSinceLastReview} days ago
													</span>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Last Reviewed</p>
											</TooltipContent>
										</Tooltip>

										<span className='hidden sm:inline font-bold'> · </span>

										{/* Stability */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-2 cursor-help flex-shrink-0'>
													<Progress 
														value={selectedTopic.stability} 
														max={365} 
														className='w-8 h-1.5' 
													/>
													<span className='text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap'>
														Stable for {selectedTopic.stability} days
													</span>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Stability ({selectedTopic.stability}/365 days)</p>
											</TooltipContent>
										</Tooltip>

										<span className='hidden sm:inline font-bold'> · </span>

										{/* Born text */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-2 cursor-help flex-shrink-0'>
													<Sprout className='h-3 w-3 sm:h-4 sm:w-4' />
													<span className='text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap'>
														Born {selectedTopic.daysSinceCreated} days ago
													</span>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>When added</p>
											</TooltipContent>
										</Tooltip>
									</div>

									{/* Populate button (mobile) */}
									<div className='sm:hidden'>
										<DropdownMenu>
											<DropdownMenuTrigger asChild={true}>
												<Button
													className='w-full'
													size='sm'
													variant='secondary'
												>
													<Baby className='h-4 w-4' />
													<span className='ml-2'>Populate</span>
													<ChevronDown className='h-4 w-4 ml-1' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuItem>
													<User className='h-4 w-4' />
													Self
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Users className='h-4 w-4' />
													Children
												</DropdownMenuItem>
												<DropdownMenuItem>
													<UserPlus className='h-4 w-4' />
													Grandchildren
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Star className='h-4 w-4' />
													All Descendants
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Family Panel */}
					<TopicFamilyPanel
						onTopicSelect={handleTopicSelectByName}
						topic={selectedTopic}
					/>

					{/* Practice/Notes Panel */}
					<PracticeNotesPanel topic={selectedTopic} />
				</div>
			</div>

			{/* Right Sidebar */}
			{!isRightSidebarHidden && (
				<ResizableSidebar
					isCollapsed={isRightSidebarCollapsed}
					maxWidth={400}
					minWidth={200}
					onToggleCollapse={() =>
						setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
					}
					onWidthChange={setRightSidebarWidth}
					side='right'
					width={rightSidebarWidth}
				>
					<ReviewSidebar topic={selectedTopic} />
				</ResizableSidebar>
			)}
		</div>
	)
}
