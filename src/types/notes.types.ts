import type { Tables } from './database.types'

export type Practice = Tables<'practice_cards'>

export type Note = Tables<'topics'> & {
	practice: Array<Practice>
}
