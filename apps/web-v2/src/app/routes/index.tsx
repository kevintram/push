import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import * as styles from '../styles/indexRoute.css'

export const Route = createFileRoute('/')({
	component: IndexRoute
})

function IndexRoute() {
	return (
		<main className={styles.page}>
			<section className={styles.hero}>
				<p className={styles.eyebrow}>3gulp v2</p>
				<div className={styles.copy}>
					<h1 className={styles.heading}>
						A clean foundation for the rewrite.
					</h1>
					<p className={styles.description}>
						Vite, React, TanStack Router, Base UI, and vanilla-extract are wired
						up. Auth and API integration are intentionally left out for the next
						step.
					</p>
				</div>
				<Button>
					Start building
					<ArrowRight aria-hidden={true} size={16} />
				</Button>
			</section>
		</main>
	)
}
