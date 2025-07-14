import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { getFruits } from '~/api/fruits'
import { FruitCard } from '~/components/FruitCard'
import { Head } from '~/components/Head'

export const Route = createFileRoute('/')({
	component: Gallery
})

function Gallery() {
	const { data } = useSuspenseQuery({
		queryFn: getFruits,
		queryKey: ['fruits']
	})

	return (
		<>
			<Head title='Vitamin' />
			<div className='m-2 grid min-h-screen grid-cols-[minmax(0,384px)] place-content-center gap-2 md:m-0 md:grid-cols-[repeat(2,minmax(0,384px))] xl:grid-cols-[repeat(3,384px)]'>
				{data.map((fruit, index) => (
					<FruitCard
						fruit={fruit}
						index={index}
						key={`FruitCard-${fruit.name}`}
					/>
				))}
			</div>
		</>
	)
}
