import * as stylex from '@stylexjs/stylex'

import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { spacing } from '~/styles/tokens.stylex'

const reviewCards = [
	{
		title: 'Spanish Basics',
		description: 'Translate "buenos dias" and say when you would use it.',
	},
	{
		title: 'Anatomy Check',
		description: 'Label the four chambers of the heart from memory.',
	},
	{
		title: 'Quick Algebra',
		description: 'Solve 3x + 5 = 20 and explain each step out loud.',
	},
	{
		title: 'Chemistry Recall',
		description: 'Name the first ten elements of the periodic table.',
	},
	{
		title: 'US Geography',
		description: 'List five state capitals in under 30 seconds.',
	},
	{
		title: 'Grammar Drill',
		description: 'Rewrite the sentence using the past perfect tense.',
	},
	{
		title: 'Biology Terms',
		description: 'Define mitosis and identify its main stages.',
	},
	{
		title: 'Music Theory',
		description: 'Build a C major triad and identify each note.',
	},
	{
		title: 'Coding Syntax',
		description: 'Explain the difference between `map` and `filter`.',
	},
	{
		title: 'History Review',
		description:
			'State one cause and one outcome of the French Revolution.',
	},
	{
		title: 'Vocabulary Match',
		description: 'Use "ephemeral" correctly in an original sentence.',
	},
	{
		title: 'Physics Prompt',
		description: 'Describe Newton’s second law in plain language.',
	},
	{
		title: 'Art Practice',
		description: 'Identify the primary colors and one secondary color.',
	},
	{
		title: 'Fractions Warmup',
		description: 'Convert 3/4 to a decimal and percentage.',
	},
	{
		title: 'French Practice',
		description: 'Conjugate "etre" in the present tense.',
	},
	{
		title: 'Reading Comprehension',
		description: 'Summarize the main idea of a paragraph in one sentence.',
	},
	{
		title: 'SAT Words',
		description: 'Define "ubiquitous" and give one real-world example.',
	},
	{
		title: 'Programming Logic',
		description: 'Write pseudocode for checking if a number is even.',
	},
	{
		title: 'Earth Science',
		description: 'Name the three main rock types and one example of each.',
	},
	{
		title: 'Public Speaking',
		description: 'Practice a 20-second explanation of your favorite topic.',
	},
]

const styles = stylex.create({
	container: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
		gap: spacing.lg,
		padding: spacing.xl,
	},
})

export function ReviewPage() {
	return (
		<div {...stylex.props(styles.container)}>
			{reviewCards.map(card => (
				<ReviewCard
					description={card.description}
					key={card.title}
					title={card.title}
				/>
			))}
		</div>
	)
}
